import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvailableTransitions, getAllTransitionsFrom, getPendingCriteria, ProjectSnapshot } from "@/lib/workflow";
import { ProjectStatus, UserRole } from "@/types/enums";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { documents: { select: { type: true } } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userRole = user.role as UserRole;
  const currentStatus = project.status as ProjectStatus;

  const snapshot: ProjectSnapshot = {
    documents: project.documents,
    poNumber: project.poNumber,
    assignedResourceId: project.assignedResourceId,
    closureNotes: project.closureNotes,
  };

  // For SUPER_ADMIN show all transitions, for others only allowed ones
  const transitions =
    userRole === "SUPER_ADMIN"
      ? getAllTransitionsFrom(currentStatus)
      : getAvailableTransitions(currentStatus, userRole);

  const result = transitions
    .filter((t) => (t.exitCriteria ?? []).length > 0)
    .map((t) => ({
      toStatus: t.to,
      label: t.label,
      pending: getPendingCriteria(t, snapshot),
      met: getPendingCriteria(t, snapshot).length === 0,
    }));

  return NextResponse.json({ currentStatus, criteria: result });
}
