import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askClaude, AI_ENABLED } from "@/lib/ai";
import { ROLE_LABELS } from "@/types/enums";

const SCOPE_LABELS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};

const STAGE_GUIDANCE: Record<string, Record<string, string>> = {
  SUBMITTED: {
    PMO_LEAD: "You are reviewing a newly submitted project request. Assess completeness, feasibility, and alignment with KGR's capabilities. Identify any missing information and flag potential risks early.",
    SUPER_ADMIN: "You are reviewing a newly submitted project request. Assess completeness and identify risks.",
  },
  UNDER_REVIEW: {
    PMO_LEAD: "The project is under your review. Decide whether to request more information, proceed to solutioning, or flag issues. Consider resource availability and timeline realism.",
    SUPER_ADMIN: "Review the project for completeness and viability before proceeding.",
  },
  INFO_REQUIRED: {
    CLIENT: "KGR has requested additional information about your project. Provide clear, detailed answers to unblock the team. The more context you give, the faster KGR can proceed.",
    PMO_LEAD: "You are waiting for client clarification. Review what was asked and consider whether the request was specific enough.",
  },
  SOLUTIONING: {
    PMO_TEAM: "You are preparing the Statement of Work for this project. Design an appropriate resource mix, confirm rate card alignment, and ensure the scope is deliverable within the timeframe. Consider similar past projects for benchmarking.",
    PMO_LEAD: "The PMO team is preparing the SOW. Monitor progress and provide guidance on resource availability.",
    SUPER_ADMIN: "Review solutioning progress and resource planning.",
  },
  SOW_DRAFT: {
    PMO_LEAD: "Review the draft SOW before sending to the client. Check commercial accuracy, scope clarity, and legal completeness. Ensure it reflects what was discussed with the client.",
    PMO_TEAM: "The SOW draft is ready. Ensure all sections are complete and commercially accurate.",
    SUPER_ADMIN: "Review the SOW draft for accuracy before client approval.",
  },
  SOW_APPROVAL: {
    CLIENT: "You are reviewing the Statement of Work. Check that the scope matches your requirements, the commercials are as agreed, and the timeline is achievable. Ask for revisions if anything is unclear.",
    PMO_LEAD: "The SOW is with the client for approval. Prepare for any questions or revision requests.",
    SUPER_ADMIN: "Monitor SOW approval status and be ready to support any client queries.",
  },
  SOW_SIGNED: {
    PMO_LEAD: "The SOW is signed. Raise the Purchase Order request promptly and confirm billing details with the client contact.",
    SUPER_ADMIN: "SOW is signed. Monitor PO request process.",
  },
  PO_REQUESTED: {
    CLIENT: "KGR has requested a Purchase Order. Coordinate with your finance/procurement team to raise the PO promptly. Delays here can push out the project start date.",
    PMO_LEAD: "The PO request is with the client. Follow up as needed to avoid delays to the project start.",
  },
  PO_RECEIVED: {
    PMO_LEAD: "The PO is received. Assign the right resource(s) from the rate card. Consider skills match, availability, and location proximity.",
    PMO_TEAM: "PO received. Review resource pool for best fit candidates for this project.",
    SUPER_ADMIN: "PO received. Review resource assignment options.",
  },
  RESOURCE_ASSIGNED: {
    PMO_LEAD: "Resources are assigned. Conduct a handover briefing with the operations team, share all project documentation, and confirm the resource start date with the client.",
    SUPER_ADMIN: "Resource assigned. Ensure handover to operations is completed.",
  },
  HANDED_TO_OPERATIONS: {
    PMO_LEAD: "The project is live with operations. Confirm delivery is underway, complete administrative closure, and update all stakeholders. Formally close this project.",
    SUPER_ADMIN: "Project in operations. Ensure formal closure and stakeholder communication.",
  },
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  if (!AI_ENABLED) {
    return NextResponse.json({ enabled: false });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      submittedBy: { select: { name: true } },
      assignedResource: { select: { name: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userRole = session.user.role as string;

  // Find similar closed projects for context
  const similarProjects = await prisma.project.findMany({
    where: {
      scopeOfWork: project.scopeOfWork,
      status: "CLOSED_SUCCESS",
      id: { not: projectId },
    },
    select: {
      projectName: true,
      location: true,
      anticipatedStartDate: true,
      anticipatedEndDate: true,
      estimatedCost: true,
      description: true,
    },
    take: 3,
    orderBy: { updatedAt: "desc" },
  });

  const stageGuidance =
    STAGE_GUIDANCE[project.status]?.[userRole] ??
    STAGE_GUIDANCE[project.status]?.PMO_LEAD ??
    "Review this project and identify the best next action.";

  const similarContext =
    similarProjects.length > 0
      ? `\n\nSIMILAR COMPLETED PROJECTS (same scope, for benchmarking):\n` +
        similarProjects
          .map(
            (p, i) =>
              `${i + 1}. "${p.projectName}" — ${p.location} — Est. Cost: ${p.estimatedCost ? `$${p.estimatedCost.toLocaleString()}` : "N/A"}`
          )
          .join("\n")
      : "";

  const systemPrompt = `You are an expert project management advisor for KGR End User Services, a managed services company delivering IT support to KarthikLLC globally. You provide concise, actionable insights to help project managers, solutioning teams, and clients succeed.

${stageGuidance}

Always be professional, specific, and concise. Respond in valid JSON only — no markdown, no extra text.`;

  const userPrompt = `PROJECT DETAILS:
- Name: ${project.projectName}
- Scope: ${SCOPE_LABELS[project.scopeOfWork] ?? project.scopeOfWork}
- Location: ${project.location}
- Start: ${project.anticipatedStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
- End: ${project.anticipatedEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
- Status: ${project.status.replace(/_/g, " ")}
- RAG: ${project.ragStatus}
- Description: ${project.description}
- Est. Cost: ${project.estimatedCost ? `$${project.estimatedCost.toLocaleString()}` : "Not yet estimated"}
- Assigned Resource: ${project.assignedResource?.name ?? "None yet"}
${project.notes ? `- Notes: ${project.notes}` : ""}${similarContext}

My role: ${ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole}
Current stage: ${project.status.replace(/_/g, " ")}

Provide insights in this exact JSON format:
{
  "summary": "2-3 sentence situational overview of this project at this stage",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
  "risks": ["risk or concern 1", "risk or concern 2"],
  "nextSteps": ["immediate next step 1", "immediate next step 2"]
}`;

  try {
    const raw = await askClaude(userPrompt, systemPrompt, 1000);

    // Strip markdown code fences if Claude adds them
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ enabled: true, ...parsed });
  } catch (err) {
    console.error("AI insights error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
