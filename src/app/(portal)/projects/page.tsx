import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { RAGBadge } from "@/components/projects/RAGBadge";
import Link from "next/link";
import { PlusCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { format } from "date-fns";
import { SCOPE_LABELS } from "@/types/enums";

export default async function ProjectsPage() {
  const user = await requireAuth();

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

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl font-800 text-[#1a1f5e] truncate">
            {user.role === "CLIENT" ? "My Requests" : "All Projects"}
          </h1>
          <p className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? "s" : ""} found</p>
        </div>
        {["CLIENT", "PMO_LEAD"].includes(user.role) && (
          <Link href="/projects/new" className="flex-shrink-0">
            <Button>
              <PlusCircle size={15} />
              <span className="hidden sm:inline">New Request</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        )}
      </div>

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
                  <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                    No projects found. {user.role === "CLIENT" && "Submit your first request to get started."}
                  </td>
                </tr>
              ) : (
                projects.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-[#e2e4f0] hover:bg-[#f4f5fb] transition-colors ${idx % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                    <td className="px-4 py-3">
                      <p className="font-600 text-[#1a1f5e] text-sm leading-tight">{p.projectName}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{p.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 whitespace-nowrap">{SCOPE_LABELS[p.scopeOfWork as keyof typeof SCOPE_LABELS] ?? p.scopeOfWork}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.location}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.submittedBy.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><RAGBadge status={p.ragStatus} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.assignedResource?.name ?? "—"}</td>
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
