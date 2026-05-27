import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Notifications } from "@/lib/email";
import { SCOPE_LABELS } from "@/types/enums";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  let projects;
  if (user.role === "CLIENT") {
    // Clients see only their own requests
    projects = await prisma.project.findMany({
      where: { submittedById: user.id },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        assignedResource: { select: { id: true, name: true } },
        documents: { select: { id: true, name: true, type: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
  } else {
    // PMO_LEAD, PMO_TEAM, and SUPER_ADMIN see all projects
    projects = await prisma.project.findMany({
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        assignedResource: { select: { id: true, name: true } },
        documents: { select: { id: true, name: true, type: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["CLIENT", "PMO_LEAD"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Server-side validations
    if (body.numberOfFtes && parseInt(body.numberOfFtes) > 500) {
      return NextResponse.json({ error: "Number of FTEs cannot exceed 500" }, { status: 400 });
    }
    if (body.poValue && parseFloat(body.poValue) < 0) {
      return NextResponse.json({ error: "PO value cannot be negative" }, { status: 400 });
    }
    if (body.budgetRangeMin && body.budgetRangeMax &&
        parseFloat(body.budgetRangeMin) > parseFloat(body.budgetRangeMax)) {
      return NextResponse.json({ error: "Budget minimum cannot exceed budget maximum" }, { status: 400 });
    }

    // Auto-escalate priority if urgency is high but priority is low
    let priority = body.priority ?? "MEDIUM";
    if ((body.urgency === "EMERGENCY" || body.urgency === "URGENT") && (priority === "MEDIUM" || priority === "LOW")) {
      priority = "HIGH";
    }

    const project = await prisma.project.create({
      data: {
        projectName: body.projectName,
        description: body.description,
        scopeOfWork: body.scopeOfWork,
        location: body.location,
        region: body.region || "NA",
        anticipatedStartDate: new Date(body.anticipatedStartDate),
        anticipatedEndDate: new Date(body.anticipatedEndDate),
        budgetAvailable: body.budgetAvailable,
        notes: body.notes || null,
        estimatedCost: body.estimatedCost || null,
        customFields: body.customFields ? body.customFields : null,
        submittedById: user.id,
        status: "SUBMITTED",
        ragStatus: "GREEN",
        priority,
        urgency:               body.urgency ?? "STANDARD",
        requestingDepartment:  body.requestingDepartment ?? null,
        businessOwner:         body.businessOwner ?? null,
        numberOfFtes:          body.numberOfFtes ? parseInt(body.numberOfFtes) : null,
        coverageModel:         body.coverageModel ?? null,
        workplaceModel:        body.workplaceModel ?? null,
        incumbentVendor:       body.incumbentVendor ?? null,
        complianceNotes:       body.complianceNotes ?? null,
        businessJustification: body.businessJustification ?? null,
        contractType:          body.contractType || null,
        estimatedMonthlyTickets: body.estimatedMonthlyTickets ? parseInt(body.estimatedMonthlyTickets) : null,
        avgHandleTimeMinutes:  body.avgHandleTimeMinutes ? parseInt(body.avgHandleTimeMinutes) : null,
        itsmPlatform:          body.itsmPlatform || null,
        estimatedAssetCount:   body.estimatedAssetCount ? parseInt(body.estimatedAssetCount) : null,
        goLiveDeadline:        body.goLiveDeadline ? new Date(body.goLiveDeadline) : null,
        budgetRangeMin:        body.budgetRangeMin ? parseFloat(body.budgetRangeMin) : null,
        budgetRangeMax:        body.budgetRangeMax ? parseFloat(body.budgetRangeMax) : null,
        businessOwnerEmail:    body.businessOwnerEmail || null,
        requiredLanguages:     body.requiredLanguages || null,
        dataClassification:    body.dataClassification || null,
      },
      include: { submittedBy: { select: { id: true, name: true, email: true } } },
    });

    await prisma.statusHistory.create({
      data: { projectId: project.id, toStatus: "SUBMITTED", changedById: user.id },
    });

    // Email all PMO Leads
    const pmoLeads = await prisma.user.findMany({
      where: { role: "PMO_LEAD" },
      select: { email: true },
    });
    if (pmoLeads.length > 0) {
      Notifications.newRequestSubmitted({
        pmoEmails: pmoLeads.map((u) => u.email),
        projectName: project.projectName,
        submittedBy: (project as unknown as { submittedBy?: { name: string } }).submittedBy?.name ?? user.id,
        scope: SCOPE_LABELS[body.scopeOfWork as keyof typeof SCOPE_LABELS] ?? body.scopeOfWork,
        location: body.location,
        projectId: project.id,
      }).catch((err) => console.error("[EMAIL ERROR]", err));
    }

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
