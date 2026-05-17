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
