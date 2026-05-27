import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  const source = await prisma.project.findUnique({
    where: { id },
    include: { resources: true },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // CLIENT can only clone their own projects
  if (user.role === "CLIENT" && source.submittedById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN", "CLIENT"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { projectName, anticipatedStartDate, anticipatedEndDate, copyResources } = body;

  if (!anticipatedStartDate || !anticipatedEndDate) {
    return NextResponse.json({ error: "anticipatedStartDate and anticipatedEndDate are required" }, { status: 400 });
  }

  const newProject = await prisma.project.create({
    data: {
      projectName: projectName || source.projectName + " (Copy)",
      description: source.description,
      scopeOfWork: source.scopeOfWork,
      region: source.region,
      location: source.location,
      anticipatedStartDate: new Date(anticipatedStartDate),
      anticipatedEndDate: new Date(anticipatedEndDate),
      budgetAvailable: source.budgetAvailable,
      notes: source.notes,
      status: "SUBMITTED",
      submittedById: user.id,
      priority: (source as unknown as { priority?: string }).priority ?? "MEDIUM",
      urgency: (source as unknown as { urgency?: string }).urgency ?? "STANDARD",
      requestingDepartment: (source as unknown as { requestingDepartment?: string | null }).requestingDepartment,
      businessOwner: (source as unknown as { businessOwner?: string | null }).businessOwner,
      numberOfFtes: (source as unknown as { numberOfFtes?: number | null }).numberOfFtes,
      coverageModel: (source as unknown as { coverageModel?: string | null }).coverageModel,
      workplaceModel: (source as unknown as { workplaceModel?: string | null }).workplaceModel,
      incumbentVendor: (source as unknown as { incumbentVendor?: string | null }).incumbentVendor,
      complianceNotes: (source as unknown as { complianceNotes?: string | null }).complianceNotes,
      businessJustification: (source as unknown as { businessJustification?: string | null }).businessJustification,
    },
  });

  if (copyResources && source.resources.length > 0) {
    await prisma.projectResource.createMany({
      data: source.resources.map((r) => ({
        projectId: newProject.id,
        userId: null,
        roleName: r.roleName,
        dailyRate: r.dailyRate,
        currency: r.currency,
        isLead: false,
      })),
    });
  }

  return NextResponse.json({ id: newProject.id, projectName: newProject.projectName }, { status: 201 });
}
