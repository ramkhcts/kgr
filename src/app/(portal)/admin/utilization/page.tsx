import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default async function ResourceUtilizationPage() {
  await requireAuth(["PMO_LEAD", "SUPER_ADMIN"]);

  const resources = await prisma.projectResource.findMany({
    where: {
      project: {
        status: { notIn: ["CLOSED_SUCCESS", "CLOSED_REJECTED", "CANCELLED"] },
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, specialization: true } },
      project: { select: { id: true, projectName: true, status: true, region: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by userId
  type Assignment = (typeof resources)[0];
  const userMap = new Map<
    string,
    {
      user: Assignment["user"];
      assignments: Assignment[];
      totalDailyCost: number;
    }
  >();

  for (const r of resources) {
    if (!r.userId || !r.user) continue;
    const existing = userMap.get(r.userId);
    if (existing) {
      existing.assignments.push(r);
      existing.totalDailyCost += r.dailyRate;
    } else {
      userMap.set(r.userId, {
        user: r.user,
        assignments: [r],
        totalDailyCost: r.dailyRate,
      });
    }
  }

  const assignedUserIds = new Set(userMap.keys());

  // Unassigned PMO team members
  const allPmoUsers = await prisma.user.findMany({
    where: { role: { in: ["PMO_TEAM", "PMO_LEAD"] } },
    select: { id: true, name: true, email: true, specialization: true, role: true },
    orderBy: { name: "asc" },
  });
  const unassignedUsers = allPmoUsers.filter((u) => !assignedUserIds.has(u.id));

  const rows = Array.from(userMap.values()).sort((a, b) =>
    (a.user?.name ?? "").localeCompare(b.user?.name ?? "")
  );

  const SPECIALIZATION_COLORS: Record<string, string> = {
    SOLUTIONING: "#7c3aed",
    DELIVERY: "#0369a1",
    COMMERCIAL: "#15803d",
    GENERAL: "#6b7280",
  };

  const STATUS_COLORS: Record<string, string> = {
    SUBMITTED: "#6b7280",
    UNDER_REVIEW: "#2563eb",
    SOLUTIONING: "#7c3aed",
    SOW_DRAFT: "#0891b2",
    SOW_APPROVAL: "#0891b2",
    SOW_SIGNED: "#16a34a",
    PO_REQUESTED: "#d97706",
    PO_RECEIVED: "#d97706",
    RESOURCE_ASSIGNED: "#16a34a",
    HANDED_TO_OPERATIONS: "#15803d",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/admin"
          className="mt-1 p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-800 text-[#1a1f5e]">Resource Utilization</h1>
          <p className="text-sm text-gray-500">Active project assignments across all live engagements</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500">Active Resources</p>
          <p className="text-2xl font-800 text-[#1a1f5e] mt-1">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Total Assignments</p>
          <p className="text-2xl font-800 text-[#1a1f5e] mt-1">{resources.filter((r) => r.userId).length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Unassigned Team Members</p>
          <p className="text-2xl font-800 text-amber-600 mt-1">{unassignedUsers.length}</p>
        </Card>
      </div>

      {/* Main utilization table */}
      <Card>
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Active Assignments</p>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No active resource assignments.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e2e4f0]">
            <table className="w-full text-sm">
              <thead className="bg-[#f4f5fb]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
                    Resource
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden md:table-cell">
                    Specialization
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
                    Active Projects
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden lg:table-cell">
                    Roles
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
                    Total Daily Rate
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden md:table-cell">
                    BG Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ user, assignments, totalDailyCost }) => {
                  if (!user) return null;
                  const roles = [...new Set(assignments.map((a) => a.roleName))];
                  const bgStatuses = assignments.map((a) => a.bgCheckStatus).filter(Boolean);
                  const cleared = bgStatuses.filter((s) => s === "CLEARED").length;
                  return (
                    <>
                      <tr
                        key={user.id}
                        className="border-t border-[#e2e4f0] hover:bg-[#f9fafb]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-600 text-[#1a1f5e]">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {user.specialization ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-600"
                              style={{
                                backgroundColor: (SPECIALIZATION_COLORS[user.specialization] ?? "#6b7280") + "18",
                                color: SPECIALIZATION_COLORS[user.specialization] ?? "#6b7280",
                              }}
                            >
                              {user.specialization.charAt(0) + user.specialization.slice(1).toLowerCase()}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1a1f5e] text-white text-xs font-700">
                            {assignments.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {roles.slice(0, 3).map((role) => (
                              <span
                                key={role}
                                className="px-1.5 py-0.5 rounded text-[10px] font-500 bg-[#e8eaf6] text-[#1a1f5e]"
                              >
                                {role}
                              </span>
                            ))}
                            {roles.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{roles.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-700 text-[#1a1f5e]">
                            ${totalDailyCost.toLocaleString()}/d
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {bgStatuses.length > 0 ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-600 ${
                                cleared === bgStatuses.length
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {cleared}/{bgStatuses.length} Cleared
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                      {/* Expanded rows for each assignment */}
                      {assignments.map((a) => (
                        <tr key={a.id} className="border-t border-[#e2e4f0] bg-[#f8f9ff]">
                          <td className="pl-10 pr-4 py-2" colSpan={2}>
                            <Link
                              href={`/projects/${a.project.id}`}
                              className="text-xs font-600 text-[#1a1f5e] hover:underline"
                            >
                              {a.project.projectName}
                            </Link>
                            <p className="text-[11px] text-gray-400">{a.project.region}</p>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-600"
                              style={{
                                backgroundColor: (STATUS_COLORS[a.project.status] ?? "#6b7280") + "18",
                                color: STATUS_COLORS[a.project.status] ?? "#6b7280",
                              }}
                            >
                              {a.project.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600 hidden lg:table-cell">{a.roleName}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {a.currency} {a.dailyRate.toLocaleString()}/d
                          </td>
                          <td className="px-4 py-2 hidden md:table-cell">
                            {a.bgCheckStatus ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-600 ${
                                  a.bgCheckStatus === "CLEARED"
                                    ? "bg-green-100 text-green-700"
                                    : a.bgCheckStatus === "FAILED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {a.bgCheckStatus.replace(/_/g, " ")}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Unassigned Users */}
      {unassignedUsers.length > 0 && (
        <Card>
          <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">
            Unassigned Team Members · {unassignedUsers.length}
          </p>
          <div className="space-y-2">
            {unassignedUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#e2e4f0]"
              >
                <div className="w-8 h-8 rounded-full bg-[#1a1f5e]/10 flex items-center justify-center text-[#1a1f5e] font-700 text-sm flex-shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-[#1a1f5e]">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-600 bg-gray-100 text-gray-500">
                    {u.role.replace(/_/g, " ")}
                  </span>
                  {u.specialization && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-600"
                      style={{
                        backgroundColor: (SPECIALIZATION_COLORS[u.specialization] ?? "#6b7280") + "18",
                        color: SPECIALIZATION_COLORS[u.specialization] ?? "#6b7280",
                      }}
                    >
                      {u.specialization.charAt(0) + u.specialization.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
