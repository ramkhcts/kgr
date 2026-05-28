import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as { id: string; role: string };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Allow creator or PMO
  const template = await prisma.projectTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canEdit = ["PMO_LEAD", "SUPER_ADMIN"].includes(user.role) || template.createdById === user.id;
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.projectTemplate.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.scopeOfWork !== undefined && { scopeOfWork: body.scopeOfWork }),
      ...(body.coverageModel !== undefined && { coverageModel: body.coverageModel }),
      ...(body.workplaceModel !== undefined && { workplaceModel: body.workplaceModel }),
      ...(body.numberOfFtes !== undefined && { numberOfFtes: body.numberOfFtes ? parseInt(String(body.numberOfFtes)) : null }),
      ...(body.region !== undefined && { region: body.region }),
      ...(body.contractType !== undefined && { contractType: body.contractType }),
      ...(body.serviceTier !== undefined && { serviceTier: body.serviceTier }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const template = await prisma.projectTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete = ["PMO_LEAD", "SUPER_ADMIN"].includes(user.role) || template.createdById === user.id;
  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.projectTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(updated);
}
