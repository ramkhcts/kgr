import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { RAGBadge } from "@/components/projects/RAGBadge";
import Link from "next/link";
import { PlusCircle, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { format, startOfMonth } from "date-fns";
import { SCOPE_LABELS, ROLE_LABELS, ProjectStatus, UserRole } from "@/types/enums";
import { STATUS_PENDING_WITH } from "@/lib/workflow";

const ACTIVE_STATUSES = [
  "SUBMITTED","UNDER_REVIEW","INFO_REQUIRED","SOLUTIONING",
  "SOW_DRAFT","SOW_APPROVAL","SOW_SIGNED","PO_REQUESTED",
  "PO_RECEIVED","RESOURCE_ASSIGNED","HANDED_TO_OPERATIONS",
] as const;

const NEEDS_ACTION_STATUSES: Partial<Record<UserRole, ProjectStatus[]>> = {
  PMO_LEAD:   ["SUBMITTED","INFO_REQUIRED","SOW_SIGNED","RESOURCE_ASSIGNED","HANDED_TO_OPERATIONS"],
  PMO_TEAM:   ["SOLUTIONING","SOW_DRAFT","PO_RECEIVED"],
  CLIENT:     ["INFO_REQUIRED","SOW_APPROVAL","PO_REQUESTED"],
  SUPER_ADMIN:["SUBMITTED","INFO_REQUIRED","SOW_SIGNED","RESOURCE_ASSIGNED","HANDED_TO_OPERATIONS"],
};

const FILTER_LABELS: Record<string, string> = {
  active: "Active Pipeline",
  action: "Needs Your Action",
  closed: "Closed This Month",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user   = await requireAuth();
  const params = await searchParams;
  const filter = params.filter ?? "";

  // Base query — role-scoped
  const allProjects = await prisma.project.findMany({
    where: user.role === "CLIENT" ? { submittedById: user.id } : undefined,
    include: {
      submittedBy:      { select: { name: true } },
      assignedResource: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Apply filter
  const monthStart = startOfMonth(new Date());

  const projects = (() => {
    if (filter === "active") {
      return allProjects.filter((p) =>
        (ACTIVE_STATUSES as readonly string[]).includes(p.status)
      );
    }
    if (filter === "action") {
      const actionStatuses = NEEDS_ACTION_STATUSES[user.role as UserRole] ?? [];
      return allProjects.filter((p) =>
        (actionStatuses as string[]).includes(p.status)
      );
    }
    if (filter === "closed") {
      return allProjects.filter(
        (p) => p.status === "CLOSED_SUCCESS" && new Date(p.updatedAt) >= monthStart
      );
    }
    return allProjects;
  })();

  const filterLabel = FILTER_LABELS[filter];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-800 text-[#1a1f5e] truncate">
              {user.role === "CLIENT" ? "My Requests" : "All Projects"}
            </h1>
            {filterLabel && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 bg-[#1a1f5e] text-white">
                {filterLabel}
                <Link href="/projects" className="hover:opacity-70 transition-opacity">
                  <X size={11} />
                </Link>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
            {filterLabel ? ` · ${filterLabel}` : ""}
            {!filterLabel && (
              <span className="ml-2 text-gray-400">
                {allProjects.length !== projects.length && `(${allProjects.length} total)`}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick filter chips */}
          <div className="hidden md:flex items-center gap-1.5">
            {[
              { label: "All",    href: "/projects" },
              { label: "Active", href: "/projects?filter=active" },
              { label: "Action", href: "/projects?filter=action" },
              { label: "Closed", href: "/projects?filter=closed" },
            ].map(({ label, href }) => {
              const active = href === (filter ? `/projects?filter=${filter}` : "/projects");
              return (
                <Link
                  key={label}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-600 transition-all ${
                    active
                      ? "bg-[#1a1f5e] text-white"
                      : "bg-[#f4f5fb] text-gray-500 hover:text-[#1a1f5e] hover:bg-[#e8eaf6]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {["CLIENT", "PMO_LEAD"].includes(user.role) && (
            <Link href="/projects/new">
              <Button>
                <PlusCircle size={15} />
                <span className="hidden sm:inline">New Request</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e4f0] bg-[#f4f5fb]">
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Project</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Scope</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Location</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Requestor</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">RAG</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Assigned To</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Start Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400 text-sm">
                    {filterLabel
                      ? `No projects match "${filterLabel}".`
                      : user.role === "CLIENT"
                        ? "No requests yet. Submit your first request to get started."
                        : "No projects found."}
                    {filterLabel && (
                      <span className="block mt-2">
                        <Link href="/projects" className="text-[#1a1f5e] font-600 hover:underline text-xs">
                          Clear filter →
                        </Link>
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                projects.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`border-b border-[#e2e4f0] hover:bg-[#f4f5fb] transition-colors ${idx % 2 === 0 ? "" : "bg-[#fafafa]"}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-600 text-[#1a1f5e] text-sm leading-tight">{p.projectName}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{p.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {SCOPE_LABELS[p.scopeOfWork as keyof typeof SCOPE_LABELS] ?? p.scopeOfWork}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.location}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.submittedBy.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                      {(() => {
                        const pw = STATUS_PENDING_WITH[p.status as ProjectStatus];
                        if (!pw) return null;
                        const isMe = pw.roles.some(
                          (r) => r === user.role || (user.role === "SUPER_ADMIN" && ["PMO_LEAD","PMO_TEAM"].includes(r))
                        );
                        return (
                          <p className={`text-[10px] mt-1 font-500 ${isMe ? "text-amber-600" : "text-gray-400"}`}>
                            {isMe ? "⚡ Your turn" : `⏳ ${pw.roles.map((r) => ROLE_LABELS[r] ?? r).join(" / ")}`}
                          </p>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><RAGBadge status={p.ragStatus} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {p.assignedResource?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(p.anticipatedStartDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id}`} className="text-[#1a1f5e] hover:text-[#3d2d8e] transition-colors">
                        <ExternalLink size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
