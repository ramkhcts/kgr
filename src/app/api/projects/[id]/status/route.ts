import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvailableTransitions, CANCEL_ALLOWED_ROLES } from "@/lib/workflow";
import { ProjectStatus, UserRole } from "@/types/enums";
import { sendStageNotification } from "@/lib/email";

async function getNotifyEmails(projectId: string, submittedById: string) {
  const [submitter, pmoLeads] = await Promise.all([
    prisma.user.findUnique({ where: { id: submittedById }, select: { email: true } }),
    prisma.user.findMany({ where: { role: "PMO_LEAD" }, select: { email: true } }),
  ]);
  return {
    clientEmails: submitter ? [submitter.email] : [],
    pmoEmails: pmoLeads.map((u) => u.email),
  };
}

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

  if (toStatus === "CANCELLED") {
    if (!CANCEL_ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: "Only PMO Leads can cancel projects" }, { status: 403 });
    }
    const updated = await prisma.project.update({
      where: { id },
      data: { status: "CANCELLED", cancelledReason: cancelledReason || "Cancelled by PMO Lead" },
    });
    await prisma.statusHistory.create({
      data: { projectId: id, fromStatus: currentStatus, toStatus: "CANCELLED", changedById: user.id, notes: cancelledReason },
    });

    const { clientEmails, pmoEmails } = await getNotifyEmails(id, project.submittedById);
    sendStageNotification({
      clientEmails, pmoEmails,
      projectName: project.projectName,
      projectId: id,
      changedBy: user.name,
      fromStatus: currentStatus,
      toStatus: "CANCELLED",
      extra: { cancelledReason: cancelledReason || "" },
    }).catch((e) => console.error("[EMAIL ERROR]", e));

    return NextResponse.json(updated);
  }

  const available = getAvailableTransitions(currentStatus, userRole);
  const transition = available.find((t) => t.to === toStatus);

  if (!transition) {
    return NextResponse.json(
      { error: `Transition from ${currentStatus} to ${toStatus} not allowed for role ${userRole}` },
      { status: 400 }
    );
  }

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

  const { clientEmails, pmoEmails } = await getNotifyEmails(id, project.submittedById);
  sendStageNotification({
    clientEmails, pmoEmails,
    projectName: project.projectName,
    projectId: id,
    changedBy: user.name,
    fromStatus: currentStatus,
    toStatus,
    extra: {
      ...(infoRequestMessage ? { infoRequestMessage } : {}),
      ...(poNumber ? { poNumber } : {}),
      ...(cancelledReason ? { cancelledReason } : {}),
    },
  }).catch((e) => console.error("[EMAIL ERROR]", e));

  return NextResponse.json(updated);
}
