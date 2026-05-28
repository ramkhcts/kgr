import { prisma } from "./prisma";
import { addDays, differenceInBusinessDays } from "date-fns";

export async function setSLATargetForStatus(projectId: string, status: string): Promise<void> {
  const policy = await prisma.sLAPolicy.findUnique({ where: { status } });
  if (!policy || !policy.isActive) return;
  const targetDate = addDays(new Date(), policy.targetDays);
  await prisma.project.update({
    where: { id: projectId },
    data: { slaTargetDate: targetDate, slaBreached: false },
  });
}

export async function recordSLABreach(projectId: string, status: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { slaTargetDate: true, poValue: true, estimatedCost: true }
  });
  if (!project?.slaTargetDate) return;

  const now = new Date();
  const daysOverdue = Math.max(0, differenceInBusinessDays(now, project.slaTargetDate));
  if (daysOverdue === 0) return;

  // SLA credit: 1% of PO value per business day overdue, max 10%
  const contractValue = project.poValue ?? project.estimatedCost ?? 0;
  const creditPct = Math.min(daysOverdue * 1, 10);
  const creditAmount = contractValue * creditPct / 100;

  await prisma.sLABreach.create({
    data: { projectId, status, daysOverdue, creditPct, creditAmount }
  });

  // Update project slaCredit (sum of all credits)
  const total = await prisma.sLABreach.aggregate({
    where: { projectId },
    _sum: { creditAmount: true }
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { slaCredit: total._sum.creditAmount ?? 0, slaBreached: true }
  });
}

export function computeSLAStatus(
  slaTargetDate: Date | null,
  warningDays: number,
  priority: string = "MEDIUM"
): "ON_TRACK" | "WARNING" | "BREACHED" {
  if (!slaTargetDate) return "ON_TRACK";
  const multiplier: Record<string, number> = { CRITICAL: 0.5, HIGH: 0.75, MEDIUM: 1, LOW: 1.5 };
  const adjustedWarningDays = Math.round(warningDays * (multiplier[priority] ?? 1));
  const now = new Date();
  const daysLeft = (slaTargetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "BREACHED";
  if (daysLeft <= adjustedWarningDays) return "WARNING";
  return "ON_TRACK";
}
