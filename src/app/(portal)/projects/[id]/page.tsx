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
import {
  SCOPE_LABELS, DOCUMENT_TYPE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, URGENCY_LABELS,
  COVERAGE_MODEL_LABELS, WORKPLACE_MODEL_LABELS, CONTRACT_TYPE_LABELS, DATA_CLASSIFICATION_LABELS,
  DATA_CLASSIFICATION_COLORS, ITSM_PLATFORM_LABELS, SERVICE_TIER_LABELS, SERVICE_TIER_COLORS,
  SHIFT_PATTERN_LABELS, BG_CHECK_STATUS_LABELS, STATUS_LABELS,
} from "@/types/enums";
import { ArrowLeft, Calendar, MapPin, DollarSign, User, Clock, FileText, Download, AlertTriangle, Users, Info, CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import { AIInsightsPanel } from "@/components/projects/AIInsightsPanel";

const CLIENT_STATUS_HINTS: Record<string, { what: string; action: string }> = {
  SUBMITTED: { what: "Your request has been received.", action: "No action needed — we will begin reviewing shortly." },
  UNDER_REVIEW: { what: "Our team is reviewing your request.", action: "No action needed. We may contact you with questions." },
  INFO_REQUIRED: { what: "We need more information before proceeding.", action: "Please check the comments section below and respond to our questions." },
  SOLUTIONING: { what: "Our team is designing the solution and estimating costs.", action: "No action needed. You will receive a Statement of Work for review soon." },
  SOW_DRAFT: { what: "A Statement of Work is being drafted.", action: "No action needed. You will be notified when it is ready for your review." },
  SOW_APPROVAL: { what: "Your Statement of Work is ready for review and signature.", action: "Please review the SOW document and sign it to proceed." },
  SOW_SIGNED: { what: "SOW signed — procurement is next.", action: "Please issue a Purchase Order referencing the SOW to authorize work to begin." },
  PO_REQUESTED: { what: "We are awaiting your Purchase Order.", action: "Please upload your PO document or provide the PO number to unblock the engagement." },
  PO_RECEIVED: { what: "PO received — we are assembling your team.", action: "No action needed. Resource assignment is in progress." },
  RESOURCE_ASSIGNED: { what: "Your team has been assigned and is being onboarded.", action: "Expect an introduction from your assigned team lead shortly." },
  HANDED_TO_OPERATIONS: { what: "Your engagement is live and in active delivery.", action: "Contact your team lead for any operational matters." },
  CLOSED_SUCCESS: { what: "This engagement has been successfully closed.", action: "Thank you for working with KGR. Please reach out if you need further support." },
  CANCELLED: { what: "This request has been cancelled.", action: "Please submit a new request if you wish to restart." },
};

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
        select: { id: true, name: true, type: true, mimeType: true, size: true, createdAt: true, version: true, supersededAt: true, uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      invoiceMilestones: { orderBy: { dueDate: "asc" } },
      changeRequests: { select: { id: true } },
      resources: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      slaBreaches: { orderBy: { breachedAt: "desc" } },
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
    priority?: string | null;
    urgency?: string | null;
    numberOfFtes?: number | null;
    coverageModel?: string | null;
    workplaceModel?: string | null;
    poValue?: number | null;
    poExpiryDate?: Date | null;
    invoicedAmount?: number | null;
    poCurrency?: string | null;
    paymentTermsDays?: number | null;
    msaReference?: string | null;
    serviceTier?: string | null;
    transitionPeriodWeeks?: number | null;
    transitionNotes?: string | null;
    incumbentContractExpiry?: Date | null;
    incumbentCooperative?: boolean | null;
    technicalContactName?: string | null;
    technicalContactEmail?: string | null;
    procurementContactName?: string | null;
    procurementContactEmail?: string | null;
    closureNotes?: string | null;
    slaCredit?: number | null;
    invoiceMilestones: {
      id: string; description: string; amount: number; dueDate: Date | null;
      invoicedAt: Date | null; paidAt: Date | null; status: string;
      invoiceNumber?: string | null; currency?: string | null;
      taxRate?: number | null; taxAmount?: number | null;
    }[];
    resources: {
      id: string; projectId: string; userId: string | null;
      user: { id: string; name: string; email: string } | null;
      roleName: string; dailyRate: number; currency: string;
      startDate: Date | null; endDate: Date | null; isLead: boolean; notes: string | null;
      bgCheckStatus?: string | null; shiftPattern?: string | null;
      externalResourceName?: string | null; externalResourceEmail?: string | null;
    }[];
  };

  const isClient = user.role === "CLIENT";
  const isPMO = ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(user.role);

  // Client timeline: determine milestones
  const sowSignedStatuses = ["SOW_SIGNED","PO_REQUESTED","PO_RECEIVED","RESOURCE_ASSIGNED","HANDED_TO_OPERATIONS","CLOSED_SUCCESS"];
  const showClientTimeline = isClient && sowSignedStatuses.includes(project.status);
  const earliestResourceStart = p.resources.length > 0
    ? p.resources.reduce((earliest, r) => {
        if (!r.startDate) return earliest;
        return (!earliest || new Date(r.startDate) < new Date(earliest)) ? r.startDate.toISOString() : earliest;
      }, null as string | null)
    : null;

  const showYourTeam = isClient && ["RESOURCE_ASSIGNED","HANDED_TO_OPERATIONS","CLOSED_SUCCESS"].includes(project.status);
  const showClientInvoices = isClient && ["PO_RECEIVED","RESOURCE_ASSIGNED","HANDED_TO_OPERATIONS","CLOSED_SUCCESS"].includes(project.status);

  const clientHint = isClient ? CLIENT_STATUS_HINTS[project.status] : null;

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

      {/* Client status hint */}
      {clientHint && (
        <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">{clientHint.what}</p>
            <p className="text-sm font-600 text-blue-900 mt-0.5">{clientHint.action}</p>
          </div>
        </div>
      )}

      {/* Client Delivery Timeline */}
      {showClientTimeline && (
        <Card>
          <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Delivery Timeline</p>
          <div className="flex items-start gap-0 overflow-x-auto">
            {[
              { label: "SOW Signed", date: project.statusHistory.find(h => h.toStatus === "SOW_SIGNED")?.changedAt ?? null, active: true },
              { label: "Resource Start", date: earliestResourceStart ? new Date(earliestResourceStart) : null, active: !!earliestResourceStart },
              { label: "Go-Live", date: p.goLiveDeadline ?? project.anticipatedStartDate, active: true },
              { label: "Engagement End", date: project.anticipatedEndDate, active: true },
            ].map((milestone, idx, arr) => (
              <div key={milestone.label} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    milestone.active ? "bg-[#1a1f5e] border-[#1a1f5e]" : "bg-white border-gray-300"
                  }`} />
                  <p className="text-xs font-600 text-[#1a1f5e] mt-2 text-center">{milestone.label}</p>
                  {milestone.date && (
                    <p className="text-[10px] text-gray-400 text-center">
                      {format(new Date(milestone.date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                {idx < arr.length - 1 && (
                  <div className="h-0.5 w-16 bg-[#e2e4f0] flex-shrink-0 -mt-6" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

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

          {/* Business Context card */}
          {(() => {
            const hasAny = p.requestingDepartment || p.businessOwner || p.businessJustification ||
              p.incumbentVendor || p.complianceNotes || p.contractType || p.dataClassification ||
              p.budgetRangeMin != null || p.budgetRangeMax != null || p.businessOwnerEmail ||
              p.goLiveDeadline || p.requiredLanguages || p.estimatedMonthlyTickets != null ||
              p.avgHandleTimeMinutes != null || p.estimatedAssetCount != null || p.itsmPlatform ||
              p.technicalContactName || p.procurementContactName || p.msaReference || p.serviceTier ||
              p.transitionPeriodWeeks != null || p.incumbentContractExpiry;
            if (!hasAny) return null;
            return (
              <Card>
                <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Business Context</p>
                <div className="space-y-3">
                  {p.requestingDepartment && (
                    <div><p className="text-xs text-gray-500 mb-1">Requesting Department</p><p className="text-sm text-gray-800">{p.requestingDepartment}</p></div>
                  )}
                  {p.businessOwner && (
                    <div><p className="text-xs text-gray-500 mb-1">Business Owner / Sponsor</p><p className="text-sm text-gray-800">{p.businessOwner}</p></div>
                  )}
                  {p.businessOwnerEmail && (
                    <div><p className="text-xs text-gray-500 mb-1">Business Owner Email</p><p className="text-sm text-gray-800">{p.businessOwnerEmail}</p></div>
                  )}
                  {p.businessJustification && (
                    <div><p className="text-xs text-gray-500 mb-1">Business Justification</p><p className="text-sm text-gray-800">{p.businessJustification}</p></div>
                  )}
                  {/* Contacts & Governance */}
                  {(p.technicalContactName || p.technicalContactEmail) && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Technical Contact</p>
                      <p className="text-sm text-gray-800">{p.technicalContactName}{p.technicalContactEmail && ` · ${p.technicalContactEmail}`}</p>
                    </div>
                  )}
                  {(p.procurementContactName || p.procurementContactEmail) && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Procurement Contact</p>
                      <p className="text-sm text-gray-800">{p.procurementContactName}{p.procurementContactEmail && ` · ${p.procurementContactEmail}`}</p>
                    </div>
                  )}
                  {p.msaReference && (
                    <div><p className="text-xs text-gray-500 mb-1">MSA / Contract Reference</p><p className="text-sm text-gray-800">{p.msaReference}</p></div>
                  )}
                  {p.serviceTier && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Service Tier</p>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-600"
                        style={{
                          backgroundColor: (SERVICE_TIER_COLORS[p.serviceTier] ?? "#6b7280") + "18",
                          color: SERVICE_TIER_COLORS[p.serviceTier] ?? "#6b7280",
                        }}
                      >
                        {SERVICE_TIER_LABELS[p.serviceTier] ?? p.serviceTier}
                      </span>
                    </div>
                  )}
                  {p.contractType && (
                    <div><p className="text-xs text-gray-500 mb-1">Contract Type</p><p className="text-sm text-gray-800">{CONTRACT_TYPE_LABELS[p.contractType] ?? p.contractType}</p></div>
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
                    <div><p className="text-xs text-gray-500 mb-1">Go-Live Deadline</p><p className="text-sm text-gray-800">{format(new Date(p.goLiveDeadline), "MMM d, yyyy")}</p></div>
                  )}
                  {p.incumbentVendor && (
                    <div><p className="text-xs text-gray-500 mb-1">Incumbent Vendor</p><p className="text-sm text-gray-800">{p.incumbentVendor}</p></div>
                  )}
                  {p.incumbentContractExpiry && (
                    <div><p className="text-xs text-gray-500 mb-1">Incumbent Contract Expiry</p><p className="text-sm text-gray-800">{format(new Date(p.incumbentContractExpiry), "MMM d, yyyy")}</p></div>
                  )}
                  {p.incumbentCooperative != null && (
                    <div><p className="text-xs text-gray-500 mb-1">Incumbent Cooperative?</p><p className="text-sm text-gray-800">{p.incumbentCooperative ? "Yes" : "No"}</p></div>
                  )}
                  {p.transitionPeriodWeeks != null && p.transitionPeriodWeeks > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Transition Period</p>
                      <p className="text-sm text-gray-800">{p.transitionPeriodWeeks} week{p.transitionPeriodWeeks !== 1 ? "s" : ""}</p>
                      {p.transitionNotes && <p className="text-xs text-gray-500 mt-0.5 italic">{p.transitionNotes}</p>}
                    </div>
                  )}
                  {p.complianceNotes && (
                    <div><p className="text-xs text-gray-500 mb-1">Compliance Requirements</p><p className="text-sm text-gray-800">{p.complianceNotes}</p></div>
                  )}
                  {p.requiredLanguages && (
                    <div><p className="text-xs text-gray-500 mb-1">Required Languages</p><p className="text-sm text-gray-800">{p.requiredLanguages}</p></div>
                  )}
                  {p.estimatedMonthlyTickets != null && (
                    <div><p className="text-xs text-gray-500 mb-1">Est. Monthly Ticket Volume</p><p className="text-sm text-gray-800">{p.estimatedMonthlyTickets.toLocaleString()}</p></div>
                  )}
                  {p.avgHandleTimeMinutes != null && (
                    <div><p className="text-xs text-gray-500 mb-1">Avg Handle Time</p><p className="text-sm text-gray-800">{p.avgHandleTimeMinutes} min</p></div>
                  )}
                  {p.itsmPlatform && (
                    <div><p className="text-xs text-gray-500 mb-1">ITSM Platform</p><p className="text-sm text-gray-800">{ITSM_PLATFORM_LABELS[p.itsmPlatform] ?? p.itsmPlatform}</p></div>
                  )}
                  {p.estimatedAssetCount != null && (
                    <div><p className="text-xs text-gray-500 mb-1">Est. Asset / Device Count</p><p className="text-sm text-gray-800">{p.estimatedAssetCount.toLocaleString()}</p></div>
                  )}
                </div>
              </Card>
            );
          })()}

          {/* Your Team (CLIENT only, post-assignment) */}
          {showYourTeam && p.resources.length > 0 && (
            <Card>
              <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Your Team</p>
              <div className="space-y-3">
                {p.resources.map((r) => {
                  const name = (r as unknown as { externalResourceName?: string | null }).externalResourceName ?? r.user?.name ?? "(unassigned)";
                  const bgCheck = (r as unknown as { bgCheckStatus?: string | null }).bgCheckStatus;
                  const shift = (r as unknown as { shiftPattern?: string | null }).shiftPattern;
                  return (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#e2e4f0]">
                      <div className="w-9 h-9 rounded-full bg-[#1a1f5e]/10 flex items-center justify-center text-[#1a1f5e] font-700 text-sm flex-shrink-0">
                        {name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-600 text-[#1a1f5e]">{name}</p>
                          {r.isLead && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-600 bg-amber-100 text-amber-700">
                              <Star size={9} fill="currentColor" />Lead
                            </span>
                          )}
                          {bgCheck === "CLEARED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-600 bg-green-100 text-green-700">
                              <CheckCircle2 size={10} />Cleared
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{r.roleName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {shift && (
                            <p className="text-xs text-gray-400">{SHIFT_PATTERN_LABELS[shift] ?? shift}</p>
                          )}
                          {r.startDate && (
                            <p className="text-xs text-gray-400">Starts {format(new Date(r.startDate), "MMM d, yyyy")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Documents & Artifacts</p>
            {project.documents.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {project.documents.map((doc) => {
                  const isSuperseded = !!(doc as unknown as { supersededAt: Date | null }).supersededAt;
                  const version = (doc as unknown as { version?: number }).version;
                  const isSOWDraft = doc.type === "SOW_DRAFT";
                  return (
                    <div key={doc.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isSuperseded ? "border-gray-200 bg-gray-50 opacity-60" : "border-[#e2e4f0] hover:bg-[#f4f5fb]"}`}>
                      <FileText size={16} className={`flex-shrink-0 ${isSuperseded ? "text-gray-400" : "text-[#1a1f5e]"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-600 truncate ${isSuperseded ? "text-gray-400" : "text-gray-800"}`}>{doc.name}</p>
                          {isSOWDraft && version != null && (
                            <span className={`text-[10px] font-700 px-1.5 py-0.5 rounded ${isSuperseded ? "bg-gray-200 text-gray-500" : "bg-[#e8eaf6] text-[#1a1f5e]"}`}>
                              v{version}
                            </span>
                          )}
                          {isSuperseded && (
                            <span className="text-[10px] font-600 px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                              Superseded
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? doc.type}
                          {" · "}{formatSize(doc.size)}
                          {" · "}{format(new Date(doc.createdAt), "MMM d, yyyy")}
                          {doc.uploadedBy && ` · ${doc.uploadedBy.name}`}
                        </p>
                      </div>
                      <a href={`/api/documents/${doc.id}`} target="_blank" rel="noopener noreferrer"
                         className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isSuperseded ? "text-gray-300" : "hover:bg-[#1a1f5e] hover:text-white text-gray-400"}`}>
                        <Download size={14} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Client read-only invoices */}
          {showClientInvoices && (
            <Card>
              <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Invoice Milestones</p>
              {p.invoiceMilestones.length === 0 ? (
                <p className="text-sm text-gray-400">No invoice milestones yet.</p>
              ) : (
                <InvoiceMilestonesPanel
                  projectId={project.id}
                  userRole={user.role}
                  readOnly={true}
                  initialMilestones={p.invoiceMilestones.map((m) => ({
                    ...m,
                    projectId: project.id,
                    dueDate: m.dueDate ? m.dueDate.toISOString() : null,
                    invoicedAt: m.invoicedAt ? m.invoicedAt.toISOString() : null,
                    paidAt: m.paidAt ? m.paidAt.toISOString() : null,
                  }))}
                />
              )}
            </Card>
          )}

          {/* Client document downloads (Gap 48) */}
          {isClient && (() => {
            const clientDocTypes = ["SIGNED_SOW", "PO", "STAFFING_ORDER"];
            const clientDocs = project.documents.filter((d) => clientDocTypes.includes(d.type));
            if (clientDocs.length === 0) return null;
            return (
              <Card>
                <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">Your Documents</p>
                <div className="space-y-2">
                  {clientDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e2e4f0] hover:bg-[#f4f5fb] transition-colors">
                      <FileText size={16} className="text-[#1a1f5e] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-600 text-gray-800 truncate">{doc.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? doc.type}
                          {" · "}{formatSize(doc.size)}
                          {" · "}{format(new Date(doc.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <a href={`/api/documents/${doc.id}`} target="_blank" rel="noopener noreferrer"
                         className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#1a1f5e] hover:text-white text-gray-400 transition-colors">
                        <Download size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}

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
                      <span className="font-600">{STATUS_LABELS[h.toStatus] ?? h.toStatus.replace(/_/g, " ")}</span>
                      {h.fromStatus && <span className="text-gray-400"> from {STATUS_LABELS[h.fromStatus] ?? h.fromStatus.replace(/_/g, " ")}</span>}
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
                  <p className="text-sm font-500 truncate" style={{ color: PRIORITY_COLORS[p.priority ?? "MEDIUM"] ?? "#2563eb" }}>
                    {PRIORITY_LABELS[p.priority ?? "MEDIUM"] ?? p.priority}
                  </p>
                </div>
              </div>
              {/* Urgency */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Clock size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Urgency</p>
                  <p className="text-sm font-500 text-gray-800 truncate">
                    {URGENCY_LABELS[p.urgency ?? "STANDARD"] ?? p.urgency}
                  </p>
                </div>
              </div>
              {/* FTEs */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Users size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">FTEs</p>
                  <p className="text-sm font-500 text-gray-800 truncate">
                    {p.numberOfFtes ? `${p.numberOfFtes} FTE${p.numberOfFtes > 1 ? "s" : ""}` : "—"}
                  </p>
                </div>
              </div>
              {/* Coverage */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Clock size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Coverage</p>
                  <p className="text-sm font-500 text-gray-800 truncate">
                    {COVERAGE_MODEL_LABELS[p.coverageModel ?? ""] ?? "—"}
                  </p>
                </div>
              </div>
              {/* Workplace */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><MapPin size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Workplace</p>
                  <p className="text-sm font-500 text-gray-800 truncate">
                    {WORKPLACE_MODEL_LABELS[p.workplaceModel ?? ""] ?? "—"}
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

          {/* Commercial card — PMO only */}
          {isPMO && (p.poValue != null || project.estimatedCost != null) && (() => {
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
                          <p className="text-sm font-700 text-[#1a1f5e]">{p.poCurrency ?? "USD"} {poValue.toLocaleString()}</p>
                          {delta != null && (
                            <span className={`text-xs font-600 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {delta >= 0 ? "+" : ""}${delta.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {p.paymentTermsDays != null && (
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-400">Payment Terms</p>
                        <p className="text-sm font-500 text-gray-800">Net {p.paymentTermsDays}</p>
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
                  {["PMO_LEAD", "SUPER_ADMIN"].includes(user.role) && (p.slaCredit ?? 0) > 0 && (() => {
                    const contractValue = (p.poValue ?? project.estimatedCost ?? 0);
                    const creditPct = contractValue > 0 ? ((p.slaCredit ?? 0) / contractValue * 100).toFixed(1) : "—";
                    return (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                        <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] text-red-600 font-600">SLA Credit Accrued</p>
                          <p className="text-sm font-700 text-red-700">${(p.slaCredit ?? 0).toLocaleString()} ({creditPct}% of contract value)</p>
                        </div>
                      </div>
                    );
                  })()}
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
                closureNotes: p.closureNotes ?? undefined,
                priority: p.priority ?? undefined,
                urgency: p.urgency ?? undefined,
                numberOfFtes: p.numberOfFtes,
                coverageModel: p.coverageModel ?? undefined,
                workplaceModel: p.workplaceModel ?? undefined,
              }}
              userRole={user.role}
            />
          )}

          {/* AI Insights */}
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
