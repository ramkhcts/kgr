"use client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

type TimelineProject = {
  id: string;
  projectName: string;
  scopeOfWork: string;
  status: string;
  ragStatus: string;
  anticipatedStartDate: string;
  anticipatedEndDate: string;
  region: string;
};

const RAG_COLORS: Record<string, string> = {
  GREEN: "#16a34a",
  AMBER: "#d97706",
  RED: "#dc2626",
};

const SCOPE_LABELS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote CC",
  FIELD_SERVICES: "Field Svcs",
};

const SCOPE_COLORS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "#1a1f5e",
  SERVICE_DESK: "#3d2d8e",
  REMOTE_COMMAND_CENTER: "#2563eb",
  FIELD_SERVICES: "#0ea5e9",
};

const REGION_OPTIONS = ["ALL", "NA", "EMEA", "LATAM", "ASPAC"];
const SCOPE_OPTIONS = ["ALL", "SITE_SUPPORT_SERVICES", "SERVICE_DESK", "REMOTE_COMMAND_CENTER", "FIELD_SERVICES"];
const ZOOM_MONTHS = [3, 6, 12];

type TooltipState = {
  project: TimelineProject;
  x: number;
  y: number;
} | null;

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function diffDays(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86400000;
}

export function TimelineView({ projects }: { projects: TimelineProject[] }) {
  const router = useRouter();
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [zoomMonths, setZoomMonths] = useState(6);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [viewStart, setViewStart] = useState<Date>(() => startOfMonth(new Date()));

  const filtered = projects.filter((p) => {
    if (regionFilter !== "ALL" && p.region !== regionFilter) return false;
    if (scopeFilter !== "ALL" && p.scopeOfWork !== scopeFilter) return false;
    return true;
  });

  const today = new Date();

  // Generate month headers for the zoom window
  const months = useMemo(() => {
    const result: { date: Date; label: string }[] = [];
    for (let i = 0; i < zoomMonths; i++) {
      const d = addMonths(viewStart, i);
      result.push({
        date: d,
        label: d.toLocaleDateString("en-US", { month: "short", year: i === 0 || d.getMonth() === 0 ? "2-digit" : undefined }),
      });
    }
    return result;
  }, [viewStart, zoomMonths]);

  const viewEnd = addMonths(viewStart, zoomMonths);
  const totalDays = diffDays(viewStart, viewEnd);

  function pctOf(date: Date): number {
    const d = diffDays(viewStart, date);
    return Math.min(100, Math.max(0, (d / totalDays) * 100));
  }

  function barWidth(start: Date, end: Date): number {
    const s = Math.max(0, diffDays(viewStart, start));
    const e = Math.min(totalDays, diffDays(viewStart, end));
    return Math.max(0, ((e - s) / totalDays) * 100);
  }

  const todayPct = pctOf(today);
  const showTodayLine = todayPct > 0 && todayPct < 100;

  const LABEL_WIDTH = 200;

  return (
    <div className="space-y-4">
      {/* Filters + zoom */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="text-sm border border-[#e2e4f0] rounded-lg px-3 py-1.5 bg-white text-[#1a1f5e] focus:outline-none"
        >
          {REGION_OPTIONS.map((r) => <option key={r} value={r}>{r === "ALL" ? "All Regions" : r}</option>)}
        </select>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="text-sm border border-[#e2e4f0] rounded-lg px-3 py-1.5 bg-white text-[#1a1f5e] focus:outline-none"
        >
          {SCOPE_OPTIONS.map((s) => <option key={s} value={s}>{s === "ALL" ? "All Scopes" : (SCOPE_LABELS[s] ?? s)}</option>)}
        </select>

        <div className="flex-1" />

        {/* Nav arrows */}
        <button
          onClick={() => setViewStart((d) => addMonths(d, -Math.floor(zoomMonths / 2)))}
          className="px-2 py-1.5 rounded-lg border border-[#e2e4f0] text-sm text-gray-600 hover:bg-[#f4f5fb] transition-colors"
        >
          ‹ Back
        </button>
        <button
          onClick={() => setViewStart(startOfMonth(new Date()))}
          className="px-3 py-1.5 rounded-lg border border-[#e2e4f0] text-xs font-600 text-[#1a1f5e] hover:bg-[#f4f5fb] transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => setViewStart((d) => addMonths(d, Math.floor(zoomMonths / 2)))}
          className="px-2 py-1.5 rounded-lg border border-[#e2e4f0] text-sm text-gray-600 hover:bg-[#f4f5fb] transition-colors"
        >
          Next ›
        </button>

        {/* Zoom */}
        <div className="flex rounded-lg border border-[#e2e4f0] overflow-hidden">
          {ZOOM_MONTHS.map((z) => (
            <button
              key={z}
              onClick={() => setZoomMonths(z)}
              className={`px-3 py-1.5 text-xs font-600 transition-colors ${zoomMonths === z ? "bg-[#1a1f5e] text-white" : "bg-white text-gray-500 hover:bg-[#f4f5fb]"}`}
            >
              {z}m
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#e2e4f0] p-8 text-center">
          <p className="text-sm text-gray-400">No projects match the current filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e2e4f0] overflow-hidden bg-white">
          {/* Month header */}
          <div className="flex border-b border-[#e2e4f0] bg-[#f4f5fb]" style={{ paddingLeft: `${LABEL_WIDTH}px` }}>
            {months.map((m) => (
              <div
                key={m.date.toISOString()}
                className="flex-1 text-center text-xs font-600 text-[#1a1f5e] py-2 border-l border-[#e2e4f0] first:border-l-0"
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#f0f1f8]">
            {filtered.map((project) => {
              const start = new Date(project.anticipatedStartDate);
              const end = new Date(project.anticipatedEndDate);
              const barColor = RAG_COLORS[project.ragStatus] ?? SCOPE_COLORS[project.scopeOfWork] ?? "#1a1f5e";
              const left = pctOf(start);
              const width = barWidth(start, end);

              return (
                <div key={project.id} className="flex items-center h-10 hover:bg-[#fafafa] group">
                  {/* Project label */}
                  <div
                    className="flex-shrink-0 px-3 flex items-center h-full border-r border-[#e2e4f0]"
                    style={{ width: `${LABEL_WIDTH}px` }}
                  >
                    <p className="text-xs font-600 text-[#1a1f5e] truncate">{project.projectName}</p>
                  </div>

                  {/* Gantt area */}
                  <div className="flex-1 relative h-full">
                    {/* Month grid lines */}
                    {months.map((m, i) => i > 0 && (
                      <div
                        key={m.date.toISOString()}
                        className="absolute top-0 bottom-0 w-px bg-[#f0f1f8]"
                        style={{ left: `${(i / zoomMonths) * 100}%` }}
                      />
                    ))}

                    {/* Today line */}
                    {showTodayLine && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-70"
                        style={{ left: `${todayPct}%` }}
                      />
                    )}

                    {/* Project bar */}
                    {width > 0 && (
                      <button
                        className="absolute top-1/2 -translate-y-1/2 h-5 rounded-sm cursor-pointer transition-opacity hover:opacity-80 flex items-center"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          minWidth: "4px",
                          backgroundColor: barColor,
                          opacity: 0.85,
                        }}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        onMouseEnter={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setTooltip({ project, x: rect.left, y: rect.top - 8 });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        aria-label={`View ${project.projectName}`}
                      >
                        <span className="text-[9px] font-600 text-white px-1.5 truncate leading-none">
                          {project.projectName}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: tooltip.y - 80, left: tooltip.x }}
        >
          <div className="bg-[#1a1f5e] text-white text-xs rounded-xl p-3 shadow-2xl max-w-xs">
            <p className="font-700 mb-1">{tooltip.project.projectName}</p>
            <p className="text-white/70">{tooltip.project.status.replace(/_/g, " ")}</p>
            <p className="text-white/70">{tooltip.project.region} · {SCOPE_LABELS[tooltip.project.scopeOfWork] ?? tooltip.project.scopeOfWork}</p>
            <p className="text-white/60 mt-1">
              {new Date(tooltip.project.anticipatedStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {" – "}
              {new Date(tooltip.project.anticipatedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RAG_COLORS[tooltip.project.ragStatus] ?? "#16a34a" }} />
              <span className="text-white/80">{tooltip.project.ragStatus}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
