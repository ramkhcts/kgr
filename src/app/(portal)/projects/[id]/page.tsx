import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { WorkflowTimeline } from "@/components/projects/WorkflowTimeline";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { RAGBadge } from "@/components/projects/RAGBadge";
import { ProjectActions } from "./ProjectActions";
import { Card } from "@/components/ui/Card";
import { format } from "date-fns";
import { SCOPE_LABELS } from "@/types/enums";
import { ArrowLeft, Calendar, MapPin, DollarSign, User, Clock } from "lucide-react";
import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      assignedResource: { select: { id: true, name: true, email: true } },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { changedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/projects" className="mt-1 p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors flex-shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-800 text-[#1a1f5e] leading-tight">{project.projectName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Project ID: {project.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <RAGBadge status={project.ragStatus} />
              <StatusBadge status={project.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Workflow Progress</p>
        <WorkflowTimeline status={project.status} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Project Details</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-800">{project.description}</p>
              </div>
              {project.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-800">{project.notes}</p>
                </div>
              )}
              {project.infoRequestMessage && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-700 text-amber-700 mb-1">Info Requested by KGR PM</p>
                  <p className="text-sm text-amber-800">{project.infoRequestMessage}</p>
                </div>
              )}
              {project.cancelledReason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs font-700 text-red-700 mb-1">Cancellation Reason</p>
                  <p className="text-sm text-red-800">{project.cancelledReason}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Activity History</p>
            <div className="space-y-3">
              {project.statusHistory.map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-[#1a1f5e]" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-600">{h.toStatus.replace(/_/g, " ")}</span>
                      {h.fromStatus && <span className="text-gray-400"> from {h.fromStatus.replace(/_/g, " ")}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">{format(new Date(h.changedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      {h.changedBy && <p className="text-xs text-gray-400">· {h.changedBy.name}</p>}
                    </div>
                    {h.notes && <p className="text-xs text-gray-500 mt-1 italic">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Meta */}
          <Card>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-3">Project Info</p>
            <div className="space-y-3">
              {[
                { icon: <User size={14} />, label: "Scope", value: SCOPE_LABELS[project.scopeOfWork as keyof typeof SCOPE_LABELS] },
                { icon: <MapPin size={14} />, label: "Location", value: project.location },
                { icon: <Calendar size={14} />, label: "Start Date", value: format(new Date(project.anticipatedStartDate), "MMM d, yyyy") },
                { icon: <Clock size={14} />, label: "End Date", value: format(new Date(project.anticipatedEndDate), "MMM d, yyyy") },
                { icon: <DollarSign size={14} />, label: "Budget", value: project.budgetAvailable ? "Available" : "Not Confirmed" },
                { icon: <User size={14} />, label: "Requestor", value: project.submittedBy.name },
                { icon: <User size={14} />, label: "Assigned To", value: project.assignedResource?.name ?? "—" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400">{label}</p>
                    <p className="text-sm font-500 text-gray-800 truncate">{value}</p>
                  </div>
                </div>
              ))}
              {project.estimatedCost && (
                <div className="flex items-start gap-2">
                  <DollarSign size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400">Est. Cost</p>
                    <p className="text-sm font-700 text-[#16a34a]">${project.estimatedCost.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {project.poNumber && (
                <div className="flex items-start gap-2">
                  <DollarSign size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400">PO Number</p>
                    <p className="text-sm font-600 text-gray-800">{project.poNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <ProjectActions project={project as Parameters<typeof ProjectActions>[0]["project"]} userRole={user.role} userId={user.id} />
        </div>
      </div>
    </div>
  );
}
