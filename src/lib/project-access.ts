/**
 * Shared helper: verify a user has access to a project.
 * CLIENTs may only access projects they submitted.
 * PMO_TEAM, PMO_LEAD, SUPER_ADMIN have unrestricted access.
 *
 * Returns the project if access is allowed, null otherwise.
 */
import { prisma } from "@/lib/prisma";

export async function assertProjectAccess(
  projectId: string,
  userId: string,
  userRole: string
): Promise<{ allowed: boolean; submittedById: string | null }> {
  if (userRole !== "CLIENT") {
    // PMO roles: no ownership restriction — just confirm project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { submittedById: true },
    });
    return { allowed: !!project, submittedById: project?.submittedById ?? null };
  }

  // CLIENT: must own the project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { submittedById: true },
  });

  if (!project) return { allowed: false, submittedById: null };
  return {
    allowed: project.submittedById === userId,
    submittedById: project.submittedById,
  };
}
