"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, differenceInBusinessDays } from "date-fns";
import { ExternalLink, Download } from "lucide-react";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { RAGBadge } from "@/components/projects/RAGBadge";
import { SCOPE_LABELS, ROLE_LABELS, ProjectStatus, UserRole } from "@/types/enums";
import { STATUS_PENDING_WITH } from "@/lib/workflow";

interface Project {
  id: string;
  projectName: string;
  description: string;
  scopeOfWork: string;
  location: string;
  status: string;
  ragStatus: string;
  anticipatedStartDate: string;
  slaTargetDate: string | null;
  slaBreached: boolean;
  submittedBy: { name: string };
  assignedResource: { name: string } | null;
  stageChangedAt: string | null;
}

interface Props {
  projects: Project[];
  userRole: string;
  filterLabel: string | undefined;
  filter: string;
  currentFilter: string;
}

export function ProjectsTableClient({ projects, userRole, filterLabel, filter, currentFilter }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const now = new Date();

  const isSelectableRole = !["CLIENT"].includes(userRole);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const eligible = projects
      .filter((p) => ["SUBMITTED", "UNDER_REVIEW"].includes(p.status))
      .map((p) => p.id);
    if (eligible.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligible));
    }
  }

  const selectedProjects = projects.filter((p) => selectedIds.has(p.id));
  const selectedStatuses = [...new Set(selectedProjects.map((p) => p.status))];
  const allSameStatus = selectedStatuses.length === 1;
  const selectedStatus = allSameStatus ? selectedStatuses[0] : null;

  function getAdvanceLabel(): string | null {
    if (!allSameStatus) return null;
    if (selectedStatus === "SUBMITTED") return "Advance to Under Review";
    if (selectedStatus === "UNDER_REVIEW") return "Advance to Solutioning";
    return null;
  }

  function getAdvanceTarget(): string | null {
    if (selectedStatus === "SUBMITTED") return "UNDER_REVIEW";
    if (selectedStatus === "UNDER_REVIEW") return "SOLUTIONING";
    return null;
  }

  async function handleBulkAdvance() {
    const toStatus = getAdvanceTarget();
    if (!toStatus) return;
    setBulkLoading(true);
    setBulkMessage("");
    try {
      const res = await fetch("/api/projects/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: [...selectedIds], toStatus }),
      });
      const data = await res.json();
      const { succeeded, failed } = data as { succeeded: string[]; failed: { id: string; reason: string }[] };
      const msg = `${succeeded.length} advanced${failed.length > 0 ? `, ${failed.length} failed` : ""}`;
      setBulkMessage(msg);
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  const advanceLabel = getAdvanceLabel();

  return (
    <>
      {/* CSV Export button for PMO roles */}
      {["PMO_LEAD", "SUPER_ADMIN"].includes(userRole) && (
        <div className="flex justify-end mb-3">
          <a
            href={`/api/projects/export${currentFilter ? `?filter=${currentFilter}` : ""}`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 bg-[#f4f5fb] text-[#1a1f5e] border border-[#e2e4f0] hover:bg-[#e8eaf6] transition-colors"
          >
            <Download size={13} />
            Export CSV
          </a>
        </div>
      )}

      {/* Mobile card list (< md) */}
      <div className="md:hidden space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {filterLabel
              ? `No projects match "${filterLabel}".`
              : userRole === "CLIENT"
                ? "No requests yet. Submit your first request to get started."
                : "No projects found."}
            {filterLabel && (
              <span className="block mt-2">
                <Link href="/projects" className="text-[#1a1f5e] font-600 hover:underline text-xs">
                  Clear filter
                </Link>
              </span>
            )}
          </div>
        ) : (
          projects.map((p) => {
            const RAG_DOT: Record<string, string> = { RED: "bg-red-500", AMBER: "bg-amber-500", GREEN: "bg-green-500" };
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block bg-white rounded-xl border border-[#e2e4f0] p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${RAG_DOT[p.ragStatus] ?? "bg-gray-400"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-700 text-[#1a1f5e] truncate">{p.projectName}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{p.location}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <StatusBadge status={p.status} />
                    <ExternalLink size={14} className="text-gray-300" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e2e4f0] bg-[#f4f5fb]">
              {isSelectableRole && (
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    className="rounded accent-[#1a1f5e] cursor-pointer"
                    onChange={toggleAll}
                    checked={
                      projects
                        .filter((p) => ["SUBMITTED", "UNDER_REVIEW"].includes(p.status))
                        .every((p) => selectedIds.has(p.id)) &&
                      projects.some((p) => ["SUBMITTED", "UNDER_REVIEW"].includes(p.status))
                    }
                  />
                </th>
              )}
              <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Project</th>
              <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Scope</th>
              <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Location</th>
              <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Requestor</th>
              <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Status</th>
              {userRole !== "CLIENT" && (
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Stage Age</th>
              )}
              {userRole !== "CLIENT" && (
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">SLA</th>
              )}
              <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">RAG</th>
              <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Assigned To</th>
              <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Start Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={isSelectableRole ? 12 : 11} className="text-center py-16 text-gray-400 text-sm">
                  {filterLabel
                    ? `No projects match "${filterLabel}".`
                    : userRole === "CLIENT"
                      ? "No requests yet. Submit your first request to get started."
                      : "No projects found."}
                  {filterLabel && (
                    <span className="block mt-2">
                      <Link href="/projects" className="text-[#1a1f5e] font-600 hover:underline text-xs">
                        Clear filter
                      </Link>
                    </span>
                  )}
                </td>
              </tr>
            ) : (
              projects.map((p, idx) => {
                const changedAt = p.stageChangedAt ? new Date(p.stageChangedAt) : null;
                const stageAgeDays = changedAt ? differenceInBusinessDays(now, changedAt) : null;
                const slaTarget = p.slaTargetDate ? new Date(p.slaTargetDate) : null;
                const slaBreached = p.slaBreached;

                let stageAgeColor = "text-green-600";
                if (stageAgeDays != null) {
                  if (stageAgeDays > 5) stageAgeColor = "text-red-600 font-bold";
                  else if (stageAgeDays >= 3) stageAgeColor = "text-amber-600";
                }

                let slaColor = "text-gray-400";
                let slaLabel = "—";
                if (slaTarget) {
                  const daysUntil = differenceInBusinessDays(slaTarget, now);
                  slaLabel = format(slaTarget, "MMM d");
                  if (slaBreached || daysUntil < 0) slaColor = "text-red-600 font-600";
                  else if (daysUntil <= 2) slaColor = "text-amber-600 font-600";
                  else slaColor = "text-green-600";
                }

                const isSelectable = isSelectableRole && ["SUBMITTED", "UNDER_REVIEW"].includes(p.status);
                const isSelected = selectedIds.has(p.id);

                return (
                  <tr
                    key={p.id}
                    className={`border-b border-[#e2e4f0] hover:bg-[#f4f5fb] transition-colors ${
                      isSelected ? "bg-[#eef0fb]" : idx % 2 === 0 ? "" : "bg-[#fafafa]"
                    }`}
                  >
                    {isSelectableRole && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          disabled={!isSelectable}
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded accent-[#1a1f5e] cursor-pointer disabled:opacity-30"
                        />
                      </td>
                    )}
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
                          (r) => r === userRole || (userRole === "SUPER_ADMIN" && ["PMO_LEAD", "PMO_TEAM"].includes(r))
                        );
                        return (
                          <p className={`text-[10px] mt-1 font-500 ${isMe ? "text-amber-600" : "text-gray-400"}`}>
                            {isMe ? "⚡ Your turn" : `⏳ ${pw.roles.map((r) => ROLE_LABELS[r as UserRole] ?? r).join(" / ")}`}
                          </p>
                        );
                      })()}
                    </td>
                    {userRole !== "CLIENT" && (
                      <td className={`px-4 py-3 text-xs whitespace-nowrap ${stageAgeColor}`}>
                        {stageAgeDays != null ? `${stageAgeDays}d` : "—"}
                      </td>
                    )}
                    {userRole !== "CLIENT" && (
                      <td className={`px-4 py-3 text-xs whitespace-nowrap ${slaColor}`}>
                        {slaLabel}
                      </td>
                    )}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating bulk action bar */}
      {isSelectableRole && selectedIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#1a1f5e] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#3d2d8e]">
          <span className="text-sm font-600">{selectedIds.size} projects selected</span>
          {allSameStatus && advanceLabel ? (
            <button
              onClick={handleBulkAdvance}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-white text-[#1a1f5e] text-xs font-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {bulkLoading ? "Processing..." : advanceLabel}
            </button>
          ) : (
            <span className="text-xs text-gray-300">Select projects with the same status to bulk advance</span>
          )}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-300 hover:text-white text-xs font-500 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Toast message */}
      {bulkMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-600">
          {bulkMessage}
        </div>
      )}
    </>
  );
}
