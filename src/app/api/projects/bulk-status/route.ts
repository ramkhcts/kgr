import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSLATargetForStatus } from "@/lib/sla";

// Only these transitions allowed for bulk operation
const ALLOWED_BULK_TRANSITIONS: Record<string, string> = {
  SUBMITTED: "UNDER_REVIEW",
  UNDER_REVIEW: "SOLUTIONING",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { projectIds, toStatus } = body as { projectIds: string[]; toStatus: string };

  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    return NextResponse.json({ error: "projectIds must be a non-empty array" }, { status: 400 });
  }

  if (!toStatus) {
    return NextResponse.json({ error: "toStatus is required" }, { status: 400 });
  }

  const succeeded: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  for (const projectId of projectIds) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true },
    });

    if (!project) {
      failed.push({ id: projectId, reason: "Not found" });
      continue;
    }

    const expectedTo = ALLOWED_BULK_TRANSITIONS[project.status];
    if (!expectedTo) {
      failed.push({ id: projectId, reason: `Status ${project.status} cannot be bulk-advanced` });
      continue;
    }

    if (expectedTo !== toStatus) {
      failed.push({
        id: projectId,
        reason: `Project is in ${project.status}, expected toStatus ${expectedTo} but got ${toStatus}`,
      });
      continue;
    }

    try {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: toStatus },
      });

      await prisma.statusHistory.create({
        data: {
          projectId,
          fromStatus: project.status,
          toStatus,
          changedById: user.id,
          notes: "Bulk status advance",
        },
      });

      setSLATargetForStatus(projectId, toStatus).catch(() => {});

      succeeded.push(projectId);
    } catch {
      failed.push({ id: projectId, reason: "Database error" });
    }
  }

  return NextResponse.json({ succeeded, failed });
}
