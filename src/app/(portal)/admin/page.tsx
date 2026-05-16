import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { ROLE_LABELS, SPECIALIZATION_LABELS } from "@/types/enums";
import { format } from "date-fns";

const ROLE_COLORS: Record<string, string> = {
  CLIENT: "#6366f1",
  PMO_LEAD: "#1a1f5e",
  PMO_TEAM: "#3d2d8e",
  SUPER_ADMIN: "#b91c1c",
};

const SPECIALIZATION_COLORS: Record<string, string> = {
  SOLUTIONING: "#7c3aed",
  DELIVERY: "#0369a1",
  COMMERCIAL: "#15803d",
  GENERAL: "#6b7280",
};

export default async function AdminPage() {
  await requireAuth(["PMO_LEAD"]);

  const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-800 text-[#1a1f5e]">User Management</h1>
        <p className="text-sm text-gray-500">{users.length} registered users</p>
      </div>

      <Card padding={false}>
        <table className="w-full text-sm">
          <thead className="bg-[#f4f5fb]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Specialization</th>
              <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Member Since</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-700 flex-shrink-0"
                      style={{ backgroundColor: ROLE_COLORS[u.role] ?? "#6b7280" }}>
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-600 text-[#1a1f5e]">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{u.email}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600"
                    style={{ backgroundColor: (ROLE_COLORS[u.role] ?? "#6b7280") + "18", color: ROLE_COLORS[u.role] ?? "#6b7280" }}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {u.role === "PMO_TEAM" && u.specialization ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600"
                      style={{
                        backgroundColor: (SPECIALIZATION_COLORS[u.specialization] ?? "#6b7280") + "18",
                        color: SPECIALIZATION_COLORS[u.specialization] ?? "#6b7280",
                      }}>
                      {SPECIALIZATION_LABELS[u.specialization] ?? u.specialization}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
