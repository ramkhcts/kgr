import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { TimelineView } from "@/components/projects/TimelineView";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

export default async function TimelinePage() {
  const user = await requireAuth();

  const projects = await prisma.project.findMany({
    where: {
      ...(user.role === "CLIENT" ? { submittedById: user.id } : {}),
    },
    select: {
      id: true,
      projectName: true,
      scopeOfWork: true,
      status: true,
      ragStatus: true,
      anticipatedStartDate: true,
      anticipatedEndDate: true,
      region: true,
    },
    orderBy: { anticipatedStartDate: "asc" },
  });

  const serialised = projects.map((p) => ({
    id: p.id,
    projectName: p.projectName,
    scopeOfWork: p.scopeOfWork,
    status: p.status,
    ragStatus: p.ragStatus,
    anticipatedStartDate: p.anticipatedStartDate.toISOString(),
    anticipatedEndDate: p.anticipatedEndDate.toISOString(),
    region: p.region,
  }));

  return (
    <div className="max-w-full space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-800 text-[#1a1f5e]">Projects Timeline</h1>
            <div className="flex rounded-lg border border-[#e2e4f0] overflow-hidden text-xs">
              <Link
                href="/projects"
                className="px-3 py-1.5 font-600 text-gray-500 bg-white hover:bg-[#f4f5fb] transition-colors"
              >
                List
              </Link>
              <Link
                href="/projects/timeline"
                className="px-3 py-1.5 font-600 bg-[#1a1f5e] text-white flex items-center gap-1"
              >
                <CalendarDays size={12} />
                Timeline
              </Link>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {serialised.length} project{serialised.length !== 1 ? "s" : ""} · Gantt-style view
          </p>
        </div>
      </div>

      <TimelineView projects={serialised} />
    </div>
  );
}
