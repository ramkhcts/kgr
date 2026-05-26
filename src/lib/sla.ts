import { prisma } from "./prisma";
import { addDays } from "date-fns";

export async function setSLATargetForStatus(projectId: string, status: string): Promise<void> {
  const policy = await prisma.sLAPolicy.findUnique({ where: { status } });
  if (!policy || !policy.isActive) return;
  const targetDate = addDays(new Date(), policy.targetDays);
  await prisma.project.update({
    where: { id: projectId },
    data: { slaTargetDate: targetDate, slaBreached: false },
  });
}

export function computeSLAStatus(
  slaTargetDate: Date | null,
  warningDays: number
): "ON_TRACK" | "WARNING" | "BREACHED" {
  if (!slaTargetDate) return "ON_TRACK";
  const now = new Date();
  const daysLeft = (slaTargetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "BREACHED";
  if (daysLeft <= warningDays) return "WARNING";
  return "ON_TRACK";
}
