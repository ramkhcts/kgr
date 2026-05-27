import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { startOfMonth } from "date-fns";
import { ProjectStatus, UserRole } from "@/types/enums";
import { ProjectsTableClient } from "@/components/projects/ProjectsTableClient";

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
  active:     "Active Pipeline",
  action:     "Needs Your Action",
  closed:     "Closed This Month",
  sla_breach: "SLA Breached",
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

  // Fetch latest status change per project for stage age (avoid N+1)
  const latestStatusChanges = await prisma.statusHistory.findMany({
    where: {
      projectId: { in: allProjects.map((p) => p.id) },
    },
    orderBy: { changedAt: "desc" },
    distinct: ["projectId"],
    select: { projectId: true, changedAt: true },
  });
  const stageAgeMap = Object.fromEntries(
    latestStatusChanges.map((s) => [s.projectId, s.changedAt.toISOString()])
  );

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
    if (filter === "sla_breach") {
      return allProjects.filter(
        (p) => (p as unknown as { slaBreached?: boolean }).slaBreached === true
      );
    }
    return allProjects;
  })();

  const filterLabel = FILTER_LABELS[filter];

  // Prepare serializable project data for client component
  const projectsForClient = projects.map((p) => {
    const pp = p as typeof p & {
      slaTargetDate?: Date | null;
      slaBreached?: boolean;
    };
    return {
      id: p.id,
      projectName: p.projectName,
      description: p.description,
      scopeOfWork: p.scopeOfWork,
      location: p.location,
      status: p.status,
      ragStatus: p.ragStatus,
      anticipatedStartDate: p.anticipatedStartDate.toISOString(),
      slaTargetDate: pp.slaTargetDate ? pp.slaTargetDate.toISOString() : null,
      slaBreached: pp.slaBreached ?? false,
      submittedBy: p.submittedBy,
      assignedResource: p.assignedResource,
      stageChangedAt: stageAgeMap[p.id] ?? null,
    };
  });

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
              { label: "SLA",    href: "/projects?filter=sla_breach" },
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

      {/* Table (client component handles checkboxes + export) */}
      <Card padding={false}>
        <ProjectsTableClient
          projects={projectsForClient}
          userRole={user.role}
          filterLabel={filterLabel}
          filter={filter}
          currentFilter={filter}
        />
      </Card>
    </div>
  );
}
