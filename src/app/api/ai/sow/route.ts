import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askClaude } from "@/lib/ai";
import { isAIActive } from "@/lib/ai-settings";

const SCOPE_LABELS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = session.user.role as string;
  if (!["PMO_TEAM", "PMO_LEAD", "SUPER_ADMIN"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAIActive()) {
    return NextResponse.json({ enabled: false, error: "AI not configured" }, { status: 503 });
  }

  const { projectId } = await request.json();
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      submittedBy: { select: { name: true, email: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get rate card entries for this scope
  const rateEntries = await prisma.rateCard.findMany({
    where: {
      serviceType: project.scopeOfWork,
      isActive: true,
      region: project.region ?? "NA",
    },
    orderBy: { hourlyRate: "asc" },
  });

  const duration = Math.ceil(
    (new Date(project.anticipatedEndDate).getTime() - new Date(project.anticipatedStartDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const systemPrompt = `You are a senior bid writer for KGR End User Services, a global managed IT services company. You write professional, commercial Statements of Work for IT support contracts delivered to KarthikLLC.

Your SOWs are:
- Precise about scope and deliverables
- Commercially clear with hours/resource mix justification
- Professional and formal in tone
- Structured with numbered sections
- Written in third person ("KGR shall provide...", "The Client shall...")

Respond in valid JSON only — no markdown, no extra text.`;

  const ratesText =
    rateEntries.length > 0
      ? rateEntries.map((r) => `  - ${r.roleName}: $${r.hourlyRate}/hr, $${r.dailyRate}/day`).join("\n")
      : "  - Standard MSA rates apply";

  const userPrompt = `Generate a professional Statement of Work for this project:

PROJECT:
- Name: ${project.projectName}
- Scope: ${SCOPE_LABELS[project.scopeOfWork] ?? project.scopeOfWork}
- Location: ${project.location}
- Duration: ${duration} days (${project.anticipatedStartDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} to ${project.anticipatedEndDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })})
- Description: ${project.description}
${project.notes ? `- Additional Context: ${project.notes}` : ""}
- Estimated Cost: ${project.estimatedCost ? `$${project.estimatedCost.toLocaleString()}` : "To be confirmed"}

APPLICABLE RATE CARD (${project.region ?? "NA"} region):
${ratesText}

Generate a complete SOW in this exact JSON format:
{
  "executiveSummary": "2-3 paragraph professional executive summary of the engagement",
  "scopeOfWork": "Detailed description of all work KGR will perform, 3-4 paragraphs",
  "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3", "Deliverable 4", "Deliverable 5"],
  "resourcePlan": "Description of proposed resource mix, roles, and rationale (2 paragraphs)",
  "timeline": "Description of key milestones and delivery schedule (1-2 paragraphs)",
  "commercials": "Commercial terms, payment schedule, and rate card reference (1-2 paragraphs)",
  "assumptions": ["Assumption 1", "Assumption 2", "Assumption 3"],
  "exclusions": ["Exclusion 1", "Exclusion 2"],
  "terms": "Standard terms and conditions summary including notice periods, change control, and IP ownership (1 paragraph)"
}`;

  try {
    const raw = await askClaude(userPrompt, systemPrompt, 2500);
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ enabled: true, sow: parsed });
  } catch (err) {
    console.error("AI SOW error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
