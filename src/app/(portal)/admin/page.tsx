import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AI_ENABLED } from "@/lib/ai";
import { getAIEnabledSetting } from "@/lib/ai-settings";
import { AISettingsCard } from "./AISettingsCard";
import { UserManagementTable } from "./UserManagementTable";
import { SLAPolicyEditor } from "./SLAPolicyEditor";
import Link from "next/link";

const STATUS_ORDER = [
  "SUBMITTED","UNDER_REVIEW","INFO_REQUIRED","SOLUTIONING","SOW_DRAFT",
  "SOW_APPROVAL","SOW_SIGNED","PO_REQUESTED","PO_RECEIVED","RESOURCE_ASSIGNED","HANDED_TO_OPERATIONS",
];

export default async function AdminPage() {
  const user = await requireAuth(["PMO_LEAD", "SUPER_ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, specialization: true, createdAt: true },
  });

  // Serialise dates for client component
  const serialised = users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));

  // Fetch SLA policies for SUPER_ADMIN
  const slaPoliciesRaw = user.role === "SUPER_ADMIN"
    ? await prisma.sLAPolicy.findMany()
    : [];
  const slaPolicies = slaPoliciesRaw.sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status);
    const bi = STATUS_ORDER.indexOf(b.status);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-800 text-[#1a1f5e]">Administration</h1>
        <p className="text-sm text-gray-500">Manage users and system settings</p>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/utilization"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e2e4f0] bg-white text-sm font-600 text-[#1a1f5e] hover:bg-[#f4f5fb] transition-colors"
        >
          Resource Utilization →
        </Link>
        <Link
          href="/admin/accounts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e2e4f0] bg-white text-sm font-600 text-[#1a1f5e] hover:bg-[#f4f5fb] transition-colors"
        >
          Client Accounts →
        </Link>
        <Link
          href="/admin/templates"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e2e4f0] bg-white text-sm font-600 text-[#1a1f5e] hover:bg-[#f4f5fb] transition-colors"
        >
          Manage Templates →
        </Link>
      </div>

      {/* AI Settings — SUPER_ADMIN only */}
      {user.role === "SUPER_ADMIN" && (
        <AISettingsCard
          apiKeyConfigured={AI_ENABLED}
          aiEnabled={getAIEnabledSetting()}
        />
      )}

      {/* SLA Policy Editor — SUPER_ADMIN only */}
      {user.role === "SUPER_ADMIN" && (
        <SLAPolicyEditor initialPolicies={slaPolicies} />
      )}

      {/* User Management — interactive table for SUPER_ADMIN, read-only for PMO_LEAD */}
      {user.role === "SUPER_ADMIN" ? (
        <UserManagementTable users={serialised} currentUserId={user.id} />
      ) : (
        /* PMO_LEAD: read-only view */
        <div>
          <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-3">
            Users · {users.length}
          </p>
          <div className="rounded-2xl border border-[#e2e4f0] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f4f5fb]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                    <td className="px-5 py-3 font-600 text-[#1a1f5e]">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{u.email}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">{u.role.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 hidden md:table-cell">
                      {u.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
