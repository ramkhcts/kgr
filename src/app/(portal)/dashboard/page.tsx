import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { RAGDistribution } from "@/components/dashboard/RAGDistribution";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { RAGBadge } from "@/components/projects/RAGBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { KGRLogo } from "@/components/layout/KGRLogo";
import { KarthikLLCLogo } from "@/components/layout/KarthikLLCLogo";
import Link from "next/link";
import { format, startOfMonth } from "date-fns";
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

  // Determine "needs action" based on role
  const needsActionStatuses: Partial<Record<UserRole, ProjectStatus[]>> = {
    PMO_LEAD: ["SUBMITTED", "INFO_REQUIRED", "SOW_SIGNED", "RESOURCE_ASSIGNED"],
    PMO_TEAM: ["SOLUTIONING", "SOW_DRAFT"],
    CLIENT: ["INFO_REQUIRED", "SOW_APPROVAL", "PO_REQUESTED"],
  };
  const myActionStatuses = needsActionStatuses[user.role as UserRole] ?? [];
  const needsAction = projects.filter((p) => myActionStatuses.includes(p.status as ProjectStatus)).length;

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
