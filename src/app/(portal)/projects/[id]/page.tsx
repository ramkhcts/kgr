import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { WorkflowTimeline } from "@/components/projects/WorkflowTimeline";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { RAGBadge } from "@/components/projects/RAGBadge";
import { ProjectActions } from "./ProjectActions";
import { EditProjectModal } from "./EditProjectModal";
import { CloneProjectModal } from "./CloneProjectModal";
import { CommentsThread } from "@/components/projects/CommentsThread";
import { InvoiceMilestonesPanel } from "@/components/projects/InvoiceMilestonesPanel";
import { ChangeRequestsPanel } from "@/components/projects/ChangeRequestsPanel";
import { Card } from "@/components/ui/Card";
import { format } from "date-fns";
import { SCOPE_LABELS, DOCUMENT_TYPE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, URGENCY_LABELS, COVERAGE_MODEL_LABELS, WORKPLACE_MODEL_LABELS, CONTRACT_TYPE_LABELS, DATA_CLASSIFICATION_LABELS, DATA_CLASSIFICATION_COLORS, ITSM_PLATFORM_LABELS } from "@/types/enums";
import { ArrowLeft, Calendar, MapPin, DollarSign, User, Clock, FileText, Download, AlertTriangle, Users } from "lucide-react";
import Link from "next/link";
import { AIInsightsPanel } from "@/components/projects/AIInsightsPanel";

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
      documents: {
        select: { id: true, name: true, type: true, mimeType: true, size: true, createdAt: true, uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      invoiceMilestones: { orderBy: { dueDate: "asc" } },
      changeRequests: { select: { id: true } },
    },
  });

  if (!project) notFound();

  // Clients can only view their own projects
  if (user.role === "CLIENT" && project.submittedById !== user.id) notFound();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

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
              <p className="text-sm text-gray-500 mt-0.5">ID: {project.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <RAGBadge status={project.ragStatus} />
              <StatusBadge status={project.status} />
              {(["PMO_LEAD", "SUPER_ADMIN"].includes(user.role) ||
                (user.role === "CLIENT" && project.submittedById === user.id)) && (
                <CloneProjectModal
                  projectId={project.id}
                  projectName={project.projectName}
                  defaultName={project.projectName + " (Copy)"}
                />
              )}
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
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Details */}
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
                  <p className="text-xs font-700 text-amber-700 mb-1">Information Requested by KGR PMO</p>
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

          {/* Business Context card — only show if at least one field is set */}
          {(() => {
            const p = project as unknown as {
              requestingDepartment?: string | null;
              businessOwner?: string | null;
              businessOwnerEmail?: string | null;
              businessJustification?: string | null;
              incumbentVendor?: string | null;
              complianceNotes?: string | null;
              contractType?: string | null;
              dataClassification?: string | null;
              budgetRangeMin?: number | null;
              budgetRangeMax?: number | null;
              goLiveDeadline?: Date | null;
              requiredLanguages?: string | null;
              estimatedMonthlyTickets?: number | null;
              avgHandleTimeMinutes?: number | null;
              estimatedAssetCount?: number | null;
              itsmPlatform?: string | null;
            };
            const hasAny = p.requestingDepartment || p.businessOwner || p.businessJustification ||
              p.incumbentVendor || p.complianceNotes || p.contractType || p.dataClassification ||
              p.budgetRangeMin != null || p.budgetRangeMax != null || p.businessOwnerEmail ||
              p.goLiveDeadline || p.requiredLanguages || p.estimatedMonthlyTickets != null ||
              p.avgHandleTimeMinutes != null || p.estimatedAssetCount != null || p.itsmPlatform;
            if (!hasAny) return null;
            return (
              <Card>
                <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Business Context</p>
                <div className="space-y-3">
                  {p.requestingDepartment && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Requesting Department</p>
                      <p className="text-sm text-gray-800">{p.requestingDepartment}</p>
                    </div>
                  )}
                  {p.businessOwner && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Business Owner / Sponsor</p>
                      <p className="text-sm text-gray-800">{p.businessOwner}</p>
                    </div>
                  )}
                  {p.businessOwnerEmail && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Business Owner Email</p>
                      <p className="text-sm text-gray-800">{p.businessOwnerEmail}</p>
                    </div>
                  )}
                  {p.businessJustification && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Business Justification</p>
                      <p className="text-sm text-gray-800">{p.businessJustification}</p>
                    </div>
                  )}
                  {p.contractType && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Contract Type</p>
                      <p className="text-sm text-gray-800">{CONTRACT_TYPE_LABELS[p.contractType] ?? p.contractType}</p>
                    </div>
                  )}
                  {p.dataClassification && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data Classification</p>
                      <p className="text-sm font-600" style={{ color: DATA_CLASSIFICATION_COLORS[p.dataClassification] ?? "#374151" }}>
                        {DATA_CLASSIFICATION_LABELS[p.dataClassification] ?? p.dataClassification}
                      </p>
                    </div>
                  )}
                  {(p.budgetRangeMin != null || p.budgetRangeMax != null) && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget Range</p>
                      <p className="text-sm text-gray-800">
                        {p.budgetRangeMin != null ? `$${p.budgetRangeMin.toLocaleString()}` : "—"}
                        {" – "}
                        {p.budgetRangeMax != null ? `$${p.budgetRangeMax.toLocaleString()}` : "—"}
                      </p>
                    </div>
                  )}
                  {p.goLiveDeadline && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Go-Live Deadline</p>
                      <p className="text-sm text-gray-800">{format(new Date(p.goLiveDeadline), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {p.incumbentVendor && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Incumbent Vendor</p>
                      <p className="text-sm text-gray-800">{p.incumbentVendor}</p>
                    </div>
                  )}
                  {p.complianceNotes && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Compliance Requirements</p>
                      <p className="text-sm text-gray-800">{p.complianceNotes}</p>
                    </div>
                  )}
                  {p.requiredLanguages && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Required Languages</p>
                      <p className="text-sm text-gray-800">{p.requiredLanguages}</p>
                    </div>
                  )}
                  {p.estimatedMonthlyTickets != null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Est. Monthly Ticket Volume</p>
                      <p className="text-sm text-gray-800">{p.estimatedMonthlyTickets.toLocaleString()}</p>
                    </div>
                  )}
                  {p.avgHandleTimeMinutes != null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Avg Handle Time</p>
                      <p className="text-sm text-gray-800">{p.avgHandleTimeMinutes} min</p>
                    </div>
                  )}
                  {p.itsmPlatform && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ITSM Platform</p>
                      <p className="text-sm text-gray-800">{ITSM_PLATFORM_LABELS[p.itsmPlatform] ?? p.itsmPlatform}</p>
                    </div>
                  )}
                  {p.estimatedAssetCount != null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Est. Asset / Device Count</p>
                      <p className="text-sm text-gray-800">{p.estimatedAssetCount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })()}

          {/* Documents */}
          <Card>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Documents & Artifacts</p>
            {project.documents.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {project.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e2e4f0] hover:bg-[#f4f5fb] transition-colors">
                    <FileText size={16} className="text-[#1a1f5e] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-600 text-gray-800 truncate">{doc.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? doc.type}
                        {" · "}{formatSize(doc.size)}
                        {" · "}{format(new Date(doc.createdAt), "MMM d, yyyy")}
                        {doc.uploadedBy && ` · ${doc.uploadedBy.name}`}
                      </p>
                    </div>
                    <a href={`/api/documents/${doc.id}`} target="_blank" rel="noopener noreferrer"
                       className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#1a1f5e] hover:text-white text-gray-400 transition-colors">
                      <Download size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Comments / Collaboration */}
          <Card>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Updates & Collaboration</p>
            <CommentsThread
              projectId={project.id}
              comments={project.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
              currentUserId={user.id}
              currentUserRole={user.role}
            />
          </Card>

          {/* Change Requests */}
          <ChangeRequestsPanel
            projectId={project.id}
            currentUserId={user.id}
            currentUserRole={user.role}
            submittedById={project.submittedById}
            projectStatus={project.status}
          />

          {/* Activity Timeline */}
          <Card>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Status History</p>
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
              {/* Priority */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><AlertTriangle size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Priority</p>
                  <p className="text-sm font-500 truncate" style={{ color: PRIORITY_COLORS[(project as unknown as {priority?: string}).priority ?? "MEDIUM"] ?? "#2563eb" }}>
                    {PRIORITY_LABELS[(project as unknown as {priority?: string}).priority ?? "MEDIUM"] ?? (project as unknown as {priority?: string}).priority}
                  </p>
                </div>
              </div>
              {/* Urgency */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Clock size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Urgency</p>
                  <p className="text-sm font-500 text-gray-800 truncate">
                    {URGENCY_LABELS[(project as unknown as {urgency?: string}).urgency ?? "STANDARD"] ?? (project as unknown as {urgency?: string}).urgency}
                  </p>
                </div>
              </div>
              {/* FTEs */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Users size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">FTEs</p>
                  <p className="text-sm font-500 text-gray-800 truncate">
                    {(project as unknown as {numberOfFtes?: number | null}).numberOfFtes
                      ? `${(project as unknown as {numberOfFtes: number}).numberOfFtes} FTE${(project as unknown as {numberOfFtes: number}).numberOfFtes > 1 ? "s" : ""}`
                      : "—"}
                  </p>
                </div>
              </div>
              {/* Coverage */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Clock size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Coverage</p>
                  <p className="text-sm font-500 text-gray-800 truncate">
                    {COVERAGE_MODEL_LABELS[(project as unknown as {coverageModel?: string | null}).coverageModel ?? ""] ?? "—"}
                  </p>
                </div>
              </div>
              {/* Workplace */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><MapPin size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Workplace</p>
                  <p className="text-sm font-500 text-gray-800 truncate">
                    {WORKPLACE_MODEL_LABELS[(project as unknown as {workplaceModel?: string | null}).workplaceModel ?? ""] ?? "—"}
                  </p>
                </div>
              </div>
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

          <ProjectActions
            project={{ id: project.id, status: project.status, ragStatus: project.ragStatus, documents: project.documents }}
            userRole={user.role}
            userId={user.id}
          />

          {/* Commercial card — PMO_LEAD / SUPER_ADMIN only, when PO or estimated cost exists */}
          {["PMO_LEAD", "SUPER_ADMIN"].includes(user.role) &&
            ((project as unknown as { poValue?: number | null }).poValue != null || project.estimatedCost != null) && (() => {
              const p = project as unknown as {
                poValue?: number | null;
                poExpiryDate?: Date | null;
                invoicedAmount?: number | null;
                invoiceMilestones: { id: string; description: string; amount: number; dueDate: Date | null; invoicedAt: Date | null; paidAt: Date | null; status: string }[];
              };
              const poValue = p.poValue;
              const estimatedCost = project.estimatedCost;
              const delta = poValue != null && estimatedCost != null ? poValue - estimatedCost : null;
              return (
                <Card>
                  <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-3">Commercial</p>
                  <div className="space-y-2 mb-4">
                    {estimatedCost != null && (
                      <div className="flex items-start gap-2">
                        <DollarSign size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] text-gray-400">Estimated Cost</p>
                          <p className="text-sm font-600 text-gray-800">${estimatedCost.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {poValue != null && (
                      <div className="flex items-start gap-2">
                        <DollarSign size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] text-gray-400">PO Value</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-700 text-[#1a1f5e]">${poValue.toLocaleString()}</p>
                            {delta != null && (
                              <span className={`text-xs font-600 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {delta >= 0 ? "+" : ""}${delta.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {p.poExpiryDate && (
                      <div className="flex items-start gap-2">
                        <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] text-gray-400">PO Expiry</p>
                          <p className="text-sm font-500 text-gray-800">{format(new Date(p.poExpiryDate), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    )}
                    {(p.invoicedAmount ?? 0) > 0 && (
                      <div className="flex items-start gap-2">
                        <DollarSign size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] text-gray-400">Total Invoiced</p>
                          <p className="text-sm font-700 text-blue-700">${(p.invoicedAmount ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <InvoiceMilestonesPanel
                    projectId={project.id}
                    userRole={user.role}
                    initialMilestones={p.invoiceMilestones.map((m) => ({
                      ...m,
                      projectId: project.id,
                      dueDate: m.dueDate ? m.dueDate.toISOString() : null,
                      invoicedAt: m.invoicedAt ? m.invoicedAt.toISOString() : null,
                      paidAt: m.paidAt ? m.paidAt.toISOString() : null,
                    }))}
                  />
                </Card>
              );
            })()}

          {(user.role === "SUPER_ADMIN" || user.role === "PMO_LEAD") && (
            <EditProjectModal
              project={{
                id: project.id,
                projectName: project.projectName,
                description: project.description,
                location: project.location,
                anticipatedStartDate: project.anticipatedStartDate.toISOString(),
                anticipatedEndDate: project.anticipatedEndDate.toISOString(),
                ragStatus: project.ragStatus,
                notes: project.notes,
                closureNotes: (project as unknown as { closureNotes?: string | null }).closureNotes,
                priority: (project as unknown as { priority?: string }).priority,
                urgency: (project as unknown as { urgency?: string }).urgency,
                numberOfFtes: (project as unknown as { numberOfFtes?: number | null }).numberOfFtes,
                coverageModel: (project as unknown as { coverageModel?: string | null }).coverageModel,
                workplaceModel: (project as unknown as { workplaceModel?: string | null }).workplaceModel,
              }}
              userRole={user.role}
            />
          )}

          {/* AI Insights — shown to all roles if project is not closed/cancelled */}
          {!["CLOSED_SUCCESS", "CANCELLED"].includes(project.status) && (
            <AIInsightsPanel
              projectId={project.id}
              userRole={user.role}
              projectStatus={project.status}
            />
          )}
        </div>
      </div>
    </div>
  );
}
