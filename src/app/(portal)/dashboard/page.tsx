import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { RAGDistribution } from "@/components/dashboard/RAGDistribution";
import { WeeklyIntakeTrend } from "@/components/dashboard/WeeklyIntakeTrend";
import { SLAComplianceGauge } from "@/components/dashboard/SLAComplianceGauge";
import { ScopeRegionBreakdown } from "@/components/dashboard/ScopeRegionBreakdown";
import { AvgStageTime } from "@/components/dashboard/AvgStageTime";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { RAGBadge } from "@/components/projects/RAGBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { KGRLogo } from "@/components/layout/KGRLogo";
import { KarthikLLCLogo } from "@/components/layout/KarthikLLCLogo";
import Link from "next/link";
import { format, startOfMonth, getISOWeek, getYear } from "date-fns";
import { STATUS_PENDING_WITH } from "@/lib/workflow";
import { ExternalLink } from "lucide-react";
import { ProjectStatus, UserRole, ROLE_LABELS, SCOPE_LABELS } from "@/types/enums";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Fetch all projects visible to this user
  let projects;
  if (user.role === "CLIENT") {
    projects = await prisma.project.findMany({
      where: { submittedById: user.id },
      include: { submittedBy: { select: { name: true } }, assignedResource: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    });
  } else {
    projects = await prisma.project.findMany({
      include: { submittedBy: { select: { name: true } }, assignedResource: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  const now = new Date();
  const monthStart = startOfMonth(now);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => !["CLOSED_SUCCESS", "CANCELLED"].includes(p.status)).length;
  const closedThisMonth = projects.filter((p) => p.status === "CLOSED_SUCCESS" && new Date(p.updatedAt) >= monthStart).length;

  const needsActionStatuses: Partial<Record<UserRole, ProjectStatus[]>> = {
    PMO_LEAD: ["SUBMITTED", "INFO_REQUIRED", "SOW_SIGNED", "RESOURCE_ASSIGNED"],
    PMO_TEAM: ["SOLUTIONING", "SOW_DRAFT"],
    CLIENT: ["INFO_REQUIRED", "SOW_APPROVAL", "PO_REQUESTED"],
  };
  const myActionStatuses = needsActionStatuses[user.role as UserRole] ?? [];
  const needsAction = projects.filter((p) => myActionStatuses.includes(p.status as ProjectStatus)).length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slaBreachedCount = await (prisma.project as any).count({
    where: {
      ...(user.role === "CLIENT" ? { submittedById: user.id } : {}),
      slaBreached: true,
      status: { notIn: ["CLOSED_SUCCESS", "CANCELLED"] },
    },
  }) as number;

  // Pipeline chart data
  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pipelineData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // RAG data
  const ragCounts = projects.reduce((acc, p) => {
    acc[p.ragStatus] = (acc[p.ragStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const ragData = Object.entries(ragCounts).map(([status, count]) => ({ status, count }));

  // Recent activity
  const recentHistory = await prisma.statusHistory.findMany({
    orderBy: { changedAt: "desc" },
    take: 8,
    include: {
      project: { select: { id: true, projectName: true } },
      changedBy: { select: { name: true } },
    },
  });

  // ────────────── Wave 3C: New chart data ──────────────

  // Weekly intake — last 8 weeks
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const weeklyProjectsRaw = await prisma.project.findMany({
    where: {
      ...(user.role === "CLIENT" ? { submittedById: user.id } : {}),
      createdAt: { gte: eightWeeksAgo },
    },
    select: { createdAt: true },
  });

  // Group by ISO week (year-week key)
  const weekMap: Record<string, { week: string; count: number }> = {};
  for (const p of weeklyProjectsRaw) {
    const d = new Date(p.createdAt);
    const yr = getYear(d);
    const wk = getISOWeek(d);
    const key = `${yr}-W${String(wk).padStart(2, "0")}`;
    if (!weekMap[key]) {
      weekMap[key] = { week: `Wk ${wk}`, count: 0 };
    }
    weekMap[key].count += 1;
  }
  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // Scope × Region breakdown (active projects only)
  const activeRawProjects = await prisma.project.findMany({
    where: {
      ...(user.role === "CLIENT" ? { submittedById: user.id } : {}),
      status: { notIn: ["CLOSED_SUCCESS", "CLOSED_REJECTED", "CANCELLED"] },
    },
    select: { scopeOfWork: true, region: true },
  });

  const scopeRegionMap: Record<string, number> = {};
  for (const p of activeRawProjects) {
    const key = `${p.scopeOfWork}::${p.region}`;
    scopeRegionMap[key] = (scopeRegionMap[key] ?? 0) + 1;
  }
  const scopeRegionData = Object.entries(scopeRegionMap).map(([key, count]) => {
    const [scope, region] = key.split("::");
    return { scope, region, count };
  });

  // SLA compliance
  const slaRawProjects = await prisma.project.findMany({
    where: {
      ...(user.role === "CLIENT" ? { submittedById: user.id } : {}),
      slaTargetDate: { not: null },
      status: { notIn: ["CLOSED_SUCCESS", "CANCELLED"] },
    },
    select: { slaTargetDate: true, slaBreached: true },
  });

  let slaOnTrack = 0;
  let slaWarning = 0;
  let slaBreachedTotal = 0;
  for (const p of slaRawProjects) {
    const pp = p as typeof p & { slaTargetDate?: Date | null; slaBreached?: boolean };
    if (!pp.slaTargetDate) continue;
    if (pp.slaBreached) {
      slaBreachedTotal += 1;
    } else {
      const daysLeft = (new Date(pp.slaTargetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysLeft <= 2) slaWarning += 1;
      else slaOnTrack += 1;
    }
  }

  // Avg stage time from StatusHistory (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentHistoryForStage = await prisma.statusHistory.findMany({
    where: { changedAt: { gte: thirtyDaysAgo } },
    select: { toStatus: true, changedAt: true, projectId: true },
    orderBy: { changedAt: "asc" },
  });

  // Compute avg days per stage from consecutive entries per project
  const projectHistMap: Record<string, { toStatus: string; changedAt: Date }[]> = {};
  for (const h of recentHistoryForStage) {
    if (!projectHistMap[h.projectId]) projectHistMap[h.projectId] = [];
    projectHistMap[h.projectId].push({ toStatus: h.toStatus, changedAt: new Date(h.changedAt) });
  }

  const stageDurationsMap: Record<string, number[]> = {};
  for (const entries of Object.values(projectHistMap)) {
    for (let i = 0; i < entries.length - 1; i++) {
      const stage = entries[i].toStatus;
      const duration =
        (entries[i + 1].changedAt.getTime() - entries[i].changedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (!stageDurationsMap[stage]) stageDurationsMap[stage] = [];
      stageDurationsMap[stage].push(duration);
    }
  }

  const stageTimeData = Object.entries(stageDurationsMap).map(([stage, durations]) => ({
    stage,
    avgDays: durations.reduce((a, b) => a + b, 0) / durations.length,
  }));

  // On-time delivery rate (PMO only)
  let onTimeRate: number | null = null;
  let financialSummary: { totalPO: number; totalInvoiced: number; totalPaid: number } | null = null;

  if (["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    const closedProjects = await prisma.project.findMany({
      where: { status: "CLOSED_SUCCESS" },
      select: { updatedAt: true, anticipatedEndDate: true },
    });
    const onTimeCount = closedProjects.filter(
      (cp) => new Date(cp.updatedAt) <= new Date(cp.anticipatedEndDate)
    ).length;
    onTimeRate = closedProjects.length > 0
      ? Math.round((onTimeCount / closedProjects.length) * 100)
      : null;

    // Financial summary
    const poSummary = await prisma.project.aggregate({
      where: { status: { notIn: ["CANCELLED"] } },
      _sum: { poValue: true, invoicedAmount: true },
    });
    const paidSummary = await prisma.invoiceMilestone.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    });
    financialSummary = {
      totalPO: poSummary._sum.poValue ?? 0,
      totalInvoiced: poSummary._sum.invoicedAmount ?? 0,
      totalPaid: paidSummary._sum.amount ?? 0,
    };
  }

  const roleLabel: Record<string, string> = {
    CLIENT: "Client",
    PMO_LEAD: "PMO Lead",
    PMO_TEAM: "PMO Team",
  };

  return (
    <div className="space-y-5">
      {/* Welcome header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-800 text-[#1a1f5e] truncate">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="text-xs md:text-sm text-gray-500 truncate">{roleLabel[user.role] ?? user.role} · KGR · {format(now, "MMM d, yyyy")}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 bg-white rounded-xl px-4 py-2 border border-[#e2e4f0] flex-shrink-0">
          <KGRLogo size={28} />
          <span className="text-[#e2e4f0]">×</span>
          <KarthikLLCLogo size={28} />
        </div>
      </div>

      {/* Stats */}
      <StatsCards
        total={totalProjects}
        active={activeProjects}
        needsAction={needsAction}
        closedThisMonth={closedThisMonth}
        slaBreached={slaBreachedCount}
        onTimeRate={onTimeRate ?? undefined}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Project Pipeline" subtitle="Projects by workflow stage" />
            {pipelineData.length > 0 ? <PipelineChart data={pipelineData} /> : <p className="text-sm text-gray-400 text-center py-8">No data yet</p>}
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader title="RAG Status" subtitle="Current health breakdown" />
            {ragData.length > 0 ? <RAGDistribution data={ragData} /> : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
          </Card>
        </div>
      </div>

      {/* Charts row 1 — Wave 3C */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyIntakeTrend data={weeklyData} />
        <SLAComplianceGauge onTrack={slaOnTrack} warning={slaWarning} breached={slaBreachedTotal} />
      </div>

      {/* Charts row 2 — Wave 3C */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScopeRegionBreakdown data={scopeRegionData} />
        <AvgStageTime data={stageTimeData} />
      </div>

      {/* Financial Summary (PMO only) */}
      {financialSummary && (
        <div>
          <p className="text-sm font-700 text-[#1a1f5e] mb-3">Financial Summary</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total PO Value Committed", value: financialSummary.totalPO, color: "#1a1f5e" },
              { label: "Total Invoiced", value: financialSummary.totalInvoiced, color: "#2563eb" },
              { label: "Total Paid", value: financialSummary.totalPaid, color: "#16a34a" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-elevated p-5">
                <p className="text-xs text-gray-500 font-500 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-2xl font-800" style={{ color }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity + Projects table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Recent Activity" />
          <div className="space-y-3">
            {recentHistory.length === 0 ? (
              <p className="text-sm text-gray-400">No activity yet.</p>
            ) : (
              recentHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#1a1f5e] mt-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700">
                      <span className="font-600 text-[#1a1f5e]">{h.project?.projectName}</span>
                      {" → "}
                      <span className="font-500">{h.toStatus.replace(/_/g, " ")}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {format(new Date(h.changedAt), "MMM d 'at' h:mm a")}
                      {h.changedBy && ` · ${h.changedBy.name}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card padding={false}>
          <div className="px-5 py-4 border-b border-[#e2e4f0]">
            <p className="text-base font-700 text-[#1a1f5e]">Projects Snapshot</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e4f0] bg-[#f4f5fb]">
                  <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e]">Project</th>
                  <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e]">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e]">RAG</th>
                  <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e]">Resource</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-[#e2e4f0] hover:bg-[#f4f5fb] transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-600 text-[#1a1f5e] line-clamp-1">{p.projectName}</p>
                      <p className="text-[10px] text-gray-400">{SCOPE_LABELS[p.scopeOfWork as keyof typeof SCOPE_LABELS]}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} />
                      {(() => {
                        const pw = STATUS_PENDING_WITH[p.status as ProjectStatus];
                        if (!pw) return null;
                        const isMe = pw.roles.some(
                          (r) => r === user.role || (user.role === "SUPER_ADMIN" && ["PMO_LEAD","PMO_TEAM"].includes(r))
                        );
                        return (
                          <p className={`text-[10px] mt-0.5 font-500 ${isMe ? "text-amber-600" : "text-gray-400"}`}>
                            {isMe ? "⚡ Your turn" : `⏳ ${pw.roles.map((r) => ROLE_LABELS[r] ?? r).join(" / ")}`}
                          </p>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap"><RAGBadge status={p.ragStatus} /></td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{p.assignedResource?.name ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/projects/${p.id}`} className="text-[#1a1f5e] hover:text-[#3d2d8e]">
                        <ExternalLink size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
