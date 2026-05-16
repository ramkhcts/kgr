import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvailableTransitions, CANCEL_ALLOWED_ROLES } from "@/lib/workflow";
import { ProjectStatus, UserRole } from "@/types/enums";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string; name: string };
  const { id } = await params;
  const body = await req.json();
  const { toStatus, notes, cancelledReason, infoRequestMessage, poNumber, assignedResourceId, ragStatus } = body;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userRole = user.role as UserRole;
  const currentStatus = project.status as ProjectStatus;

  // Handle cancellation
  if (toStatus === "CANCELLED") {
    if (!CANCEL_ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: "Only Program Managers can cancel projects" }, { status: 403 });
    }
    const updated = await prisma.project.update({
      where: { id },
      data: { status: "CANCELLED", cancelledReason: cancelledReason || "Cancelled by PM" },
    });
    await prisma.statusHistory.create({
      data: { projectId: id, fromStatus: currentStatus, toStatus: "CANCELLED", changedById: user.id, notes: cancelledReason },
    });
    return NextResponse.json(updated);
  }

  // Check valid transition
  const available = getAvailableTransitions(currentStatus, userRole);
  const transition = available.find((t) => t.to === toStatus);

  if (!transition) {
    return NextResponse.json(
      { error: `Transition from ${currentStatus} to ${toStatus} not allowed for role ${userRole}` },
      { status: 400 }
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = { status: toStatus };
  if (ragStatus) updateData.ragStatus = ragStatus;
  if (infoRequestMessage) updateData.infoRequestMessage = infoRequestMessage;
  if (poNumber) updateData.poNumber = poNumber;
  if (assignedResourceId) updateData.assignedResourceId = assignedResourceId;

  const updated = await prisma.project.update({ where: { id }, data: updateData });

  await prisma.statusHistory.create({
    data: { projectId: id, fromStatus: currentStatus, toStatus, changedById: user.id, notes: notes || null },
  });

  await prisma.auditLog.create({
    data: { projectId: id, userId: user.id, action: `Status changed: ${currentStatus} → ${toStatus}`, details: notes },
  });

  // Email notifications (console log in dev)
  console.log(`[EMAIL] Status change: ${project.projectName} → ${toStatus} by ${user.name}`);

  return NextResponse.json(updated);
}
