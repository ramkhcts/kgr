import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; crId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id, crId } = await params;

  const isPMOLead = ["PMO_LEAD", "SUPER_ADMIN"].includes(user.role);
  const isClient = user.role === "CLIENT";

  if (!isPMOLead && !isClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cr = await prisma.changeRequest.findUnique({
    where: { id: crId },
    select: { id: true, projectId: true, submittedById: true, status: true },
  });

  if (!cr || cr.projectId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  // CLIENT can only withdraw their own PENDING CRs
  if (isClient) {
    if (cr.submittedById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (body.status !== "WITHDRAWN" || cr.status !== "PENDING") {
      return NextResponse.json({ error: "Clients can only withdraw their own PENDING CRs" }, { status: 400 });
    }
    const updated = await prisma.changeRequest.update({
      where: { id: crId },
      data: { status: "WITHDRAWN" },
      include: {
        submittedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(updated);
  }

  // PMO_LEAD / SUPER_ADMIN review
  const { status, responseNotes } = body;
  const allowed = ["APPROVED", "REJECTED", "UNDER_REVIEW"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    status,
    responseNotes: responseNotes ?? null,
    reviewedById: user.id,
    reviewedAt: new Date(),
  };

  const updated = await prisma.changeRequest.update({
    where: { id: crId },
    data: updateData,
    include: {
      submittedBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  // On APPROVED: bump project ragStatus to AMBER if currently GREEN
  if (status === "APPROVED") {
    const project = await prisma.project.findUnique({ where: { id }, select: { ragStatus: true } });
    if (project?.ragStatus === "GREEN") {
      await prisma.project.update({ where: { id }, data: { ragStatus: "AMBER" } });
    }
  }

  return NextResponse.json(updated);
}
