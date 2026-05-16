import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  let projects;
  if (user.role === "BUSINESS_USER") {
    projects = await prisma.project.findMany({
      where: { submittedById: user.id },
      include: { submittedBy: { select: { id: true, name: true, email: true } }, assignedResource: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
  } else if (user.role === "CUSTOMER_APPROVER") {
    projects = await prisma.project.findMany({
      where: { status: { in: ["SOW_APPROVAL", "SOW_SIGNED", "PO_REQUESTED", "PO_RECEIVED", "RESOURCE_ASSIGNED", "CLOSED_SUCCESS"] } },
      include: { submittedBy: { select: { id: true, name: true, email: true } }, assignedResource: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
  } else {
    projects = await prisma.project.findMany({
      include: { submittedBy: { select: { id: true, name: true, email: true } }, assignedResource: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "BUSINESS_USER" && user.role !== "PROGRAM_MANAGER") {
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
        anticipatedStartDate: new Date(body.anticipatedStartDate),
        anticipatedEndDate: new Date(body.anticipatedEndDate),
        budgetAvailable: body.budgetAvailable,
        notes: body.notes || null,
        estimatedCost: body.estimatedCost || null,
        submittedById: user.id,
        status: "SUBMITTED",
        ragStatus: "GREEN",
      },
      include: { submittedBy: { select: { id: true, name: true, email: true } } },
    });

    await prisma.statusHistory.create({
      data: { projectId: project.id, toStatus: "SUBMITTED", changedById: user.id },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
