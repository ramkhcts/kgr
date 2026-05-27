import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, resourceId } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "roleName", "dailyRate", "currency", "startDate", "endDate", "isLead", "notes", "userId",
    "bgCheckStatus", "shiftPattern", "rampUpEndDate", "rampDownStartDate",
    "externalResourceName", "externalResourceEmail",
  ];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "startDate" || field === "endDate" || field === "rampUpEndDate" || field === "rampDownStartDate") {
        updateData[field] = body[field] ? new Date(body[field]) : null;
      } else if (field === "dailyRate") {
        updateData[field] = parseFloat(body[field]);
      } else {
        updateData[field] = body[field];
      }
    }
  }

  const resource = await prisma.projectResource.update({
    where: { id: resourceId, projectId: id },
    data: updateData,
    include: { user: { select: { name: true, email: true } } },
  });

  // If isLead set to true, update project.assignedResourceId
  if (body.isLead === true && resource.userId) {
    await prisma.project.update({
      where: { id },
      data: { assignedResourceId: resource.userId },
    });
  }

  return NextResponse.json(resource);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, resourceId } = await params;

  const resource = await prisma.projectResource.findUnique({
    where: { id: resourceId, projectId: id },
  });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.projectResource.delete({ where: { id: resourceId } });

  // If this was the lead, find the next resource and promote it
  if (resource.isLead) {
    const nextResource = await prisma.projectResource.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
    });

    if (nextResource) {
      await prisma.projectResource.update({
        where: { id: nextResource.id },
        data: { isLead: true },
      });
      await prisma.project.update({
        where: { id },
        data: { assignedResourceId: nextResource.userId ?? null },
      });
    } else {
      // No more resources — clear the lead
      await prisma.project.update({
        where: { id },
        data: { assignedResourceId: null },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
