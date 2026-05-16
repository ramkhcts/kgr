"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { STATUS_PENDING_WITH, STATUS_LABELS } from "@/lib/workflow";
import { ProjectStatus } from "@/types/enums";

type NotifProject = {
  id: string;
  projectName: string;
  status: string;
  ragStatus: string;
  location: string;
};

const RAG_COLOR: Record<string, string> = {
  RED:   "bg-red-500",
  AMBER: "bg-amber-500",
  GREEN: "bg-green-500",
};

export function NotificationBell({ userRole }: { userRole: string }) {
  const [open, setOpen]         = useState(false);
  const [pending, setPending]   = useState<NotifProject[]>([]);
  const [loading, setLoading]   = useState(true);
  const ref                     = useRef<HTMLDivElement>(null);

  // Fetch projects that are pending the current user's role
  useEffect(() => {
    setLoading(true);
    fetch("/api/projects")
      .then((r) => r.json())
      .then((all: NotifProject[]) => {
        const mine = all.filter((p) => {
          const pw = STATUS_PENDING_WITH[p.status as ProjectStatus];
          if (!pw) return false;
          return pw.roles.some(
            (r) =>
              r === userRole ||
              (userRole === "SUPER_ADMIN" && ["PMO_LEAD", "PMO_TEAM"].includes(r))
          );
        });
        setPending(mine);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userRole]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-[#f4f5fb] text-gray-400 hover:text-[#1a1f5e] transition-colors"
        aria-label={`Notifications — ${pending.length} pending`}
      >
        <Bell size={18} />
        {!loading && pending.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-700 flex items-center justify-center">
            {pending.length > 9 ? "9+" : pending.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#e2e4f0] z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#e2e4f0] flex items-center justify-between">
            <div>
              <p className="text-sm font-700 text-[#1a1f5e]">Actions Required</p>
              <p className="text-xs text-gray-500">
                {pending.length === 0
                  ? "Nothing pending for you"
                  : `${pending.length} project${pending.length !== 1 ? "s" : ""} waiting for your action`}
              </p>
            </div>
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-700">
                {pending.length}
              </span>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-gray-400 animate-pulse">Loading...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="px-4 py-8 flex flex-col items-center gap-2">
              <CheckCircle2 size={28} className="text-green-400" />
              <p className="text-sm font-600 text-gray-500">All caught up!</p>
              <p className="text-xs text-gray-400">No projects are waiting for your action.</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-[#f0f1f8]">
              {pending.map((p) => {
                const pw  = STATUS_PENDING_WITH[p.status as ProjectStatus];
                const dot = RAG_COLOR[p.ragStatus] ?? "bg-gray-400";
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[#f4f5fb] transition-colors group"
                  >
                    {/* RAG dot */}
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-600 text-[#1a1f5e] truncate group-hover:text-[#3d2d8e] transition-colors">
                        {p.projectName}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{p.location}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block text-[10px] font-600 bg-[#1a1f5e]/10 text-[#1a1f5e] rounded px-1.5 py-0.5 whitespace-nowrap">
                          {STATUS_LABELS[p.status as ProjectStatus] ?? p.status}
                        </span>
                      </div>
                      {pw && (
                        <p className="text-[10px] text-amber-600 mt-0.5 line-clamp-1">{pw.hint}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {pending.length > 0 && (
            <div className="border-t border-[#e2e4f0] px-4 py-2">
              <Link
                href="/projects"
                onClick={() => setOpen(false)}
                className="text-xs font-600 text-[#1a1f5e] hover:text-[#3d2d8e] transition-colors"
              >
                View all projects →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
