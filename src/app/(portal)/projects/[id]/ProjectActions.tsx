"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { getAvailableTransitions, CANCEL_ALLOWED_ROLES, TRANSITIONS } from "@/lib/workflow";
import { ProjectStatus, UserRole, RAGStatus } from "@/types/enums";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { FileText, UserCheck, XCircle, ArrowRight, Upload, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

type DocumentMeta = { id: string; name: string; type: string };

type Project = {
  id: string;
  status: string;
  ragStatus: string;
  documents?: DocumentMeta[];
};

type ExitCriteriaResult = {
  currentStatus: string;
  criteria: {
    toStatus: string;
    label: string;
    pending: string[];
    met: boolean;
  }[];
};

const RAG_OPTIONS = [
  { value: "GREEN", label: "Green — On Track" },
  { value: "AMBER", label: "Amber — At Risk" },
  { value: "RED", label: "Red — Blocked" },
];

export function ProjectActions({ project, userRole, userId }: {
  project: Project;
  userRole: string;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showInfoRequest, setShowInfoRequest] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [ragStatus, setRagStatus] = useState(project.ragStatus);
  const [notes, setNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("OTHER");
  const [uploadName, setUploadName] = useState("");
  const [pendingCriteria, setPendingCriteria] = useState<string[]>([]);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideToStatus, setOverrideToStatus] = useState("");
  const [exitCriteria, setExitCriteria] = useState<ExitCriteriaResult | null>(null);

  const currentStatus = project.status as ProjectStatus;
  const role = userRole as UserRole;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  // SUPER_ADMIN gets PMO_LEAD transitions for display
  const effectiveRole: UserRole = isSuperAdmin ? "PMO_LEAD" : role;
  const transitions = getAvailableTransitions(currentStatus, effectiveRole);
  const canCancel =
    (CANCEL_ALLOWED_ROLES.includes(role) || isSuperAdmin) &&
    !["CLOSED_SUCCESS", "CANCELLED", "HANDED_TO_OPERATIONS"].includes(currentStatus);
  const canUpload = ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole);

  const sowDoc = project.documents?.find((d) => d.type === "SOW_DRAFT");

  // Fetch exit criteria proactively
  useEffect(() => {
    fetch(`/api/projects/${project.id}/exit-criteria`)
      .then((r) => r.json())
      .then((data: ExitCriteriaResult) => setExitCriteria(data))
      .catch(() => {});
  }, [project.id, project.status]);

  async function doTransition(toStatus: string, extra?: Record<string, unknown>) {
    setLoading(toStatus);
    setPendingCriteria([]);
    try {
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, notes, ragStatus, ...extra }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        if (data.pending && Array.isArray(data.pending)) {
          setPendingCriteria(data.pending);
        }
      }
    } finally {
      setLoading(null);
      setShowInfoRequest(false);
      setShowCancel(false);
    }
  }

  async function doOverride() {
    if (!overrideReason || !overrideToStatus) return;
    setLoading("override");
    try {
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: overrideToStatus, overrideReason, notes }),
      });
      if (res.ok) {
        setShowOverride(false);
        setOverrideReason("");
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setLoading("upload");
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("type", uploadType);
      fd.append("name", uploadName || uploadFile.name);
      const res = await fetch(`/api/projects/${project.id}/documents`, { method: "POST", body: fd });
      if (res.ok) {
        setShowUpload(false);
        setUploadFile(null);
        setUploadName("");
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  // All possible statuses for override selector
  const allStatuses = Object.values({
    SUBMITTED: "SUBMITTED", UNDER_REVIEW: "UNDER_REVIEW", INFO_REQUIRED: "INFO_REQUIRED",
    SOLUTIONING: "SOLUTIONING", SOW_DRAFT: "SOW_DRAFT", SOW_APPROVAL: "SOW_APPROVAL",
    SOW_SIGNED: "SOW_SIGNED", PO_REQUESTED: "PO_REQUESTED", PO_RECEIVED: "PO_RECEIVED",
    RESOURCE_ASSIGNED: "RESOURCE_ASSIGNED", HANDED_TO_OPERATIONS: "HANDED_TO_OPERATIONS",
    CLOSED_SUCCESS: "CLOSED_SUCCESS", CANCELLED: "CANCELLED",
  } as Record<string, string>).filter((s) => s !== currentStatus);

  return (
    <>
      <Card>
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-3">Actions</p>
        <div className="space-y-2">
          {/* RAG Update — PMO only */}
          {["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole) && (
            <div className="space-y-1.5">
              <Select
                label="Update RAG Status"
                options={RAG_OPTIONS}
                value={ragStatus}
                onChange={(e) => setRagStatus(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await fetch(`/api/projects/${project.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ragStatus }),
                  });
                  router.refresh();
                }}
              >
                Save RAG
              </Button>
            </div>
          )}

          {/* SOW generation — PMO_TEAM in SOLUTIONING */}
          {currentStatus === "SOLUTIONING" && role === "PMO_TEAM" && (
            <Link href={`/projects/${project.id}/sow`}>
              <Button className="w-full" size="sm">
                <FileText size={14} />
                Generate SOW
              </Button>
            </Link>
          )}

          {/* View SOW — anyone if doc exists */}
          {sowDoc && (
            <a href={`/api/documents/${sowDoc.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full" size="sm">
                <FileText size={14} />
                View SOW PDF
              </Button>
            </a>
          )}

          {/* Client: Sign SOW */}
          {currentStatus === "SOW_APPROVAL" && role === "CLIENT" && (
            <Link href={`/projects/${project.id}/sow`}>
              <Button className="w-full" size="sm">
                <UserCheck size={14} />
                Review & Sign SOW
              </Button>
            </Link>
          )}

          {/* Resource Assignment */}
          {currentStatus === "PO_RECEIVED" && ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole) && (
            <Link href={`/projects/${project.id}/resources`}>
              <Button className="w-full" size="sm">
                <UserCheck size={14} />
                Assign Resource
              </Button>
            </Link>
          )}

          {/* Upload document — PMO only */}
          {canUpload && !["CLOSED_SUCCESS", "CANCELLED"].includes(currentStatus) && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => setShowUpload(true)}>
              <Upload size={13} />
              Upload Document
            </Button>
          )}

          {/* Pending criteria warning */}
          {pendingCriteria.length > 0 && (
            <div className="rounded-lg p-3 bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs font-700 text-amber-700">Cannot advance — items needed:</p>
              </div>
              <ul className="space-y-1">
                {pendingCriteria.map((c, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Workflow transitions */}
          {transitions
            .filter((t) => !["INFO_REQUIRED", "SOW_DRAFT", "SOW_SIGNED", "RESOURCE_ASSIGNED"].includes(t.to))
            .map((t) => (
              <Button
                key={t.to}
                size="sm"
                variant={["CLOSED_SUCCESS", "HANDED_TO_OPERATIONS"].includes(t.to) ? "secondary" : "primary"}
                className="w-full"
                loading={loading === t.to}
                onClick={() => doTransition(t.to)}
              >
                <ArrowRight size={13} />
                {t.label}
              </Button>
            ))}

          {/* Info request trigger */}
          {transitions.some((t) => t.to === "INFO_REQUIRED") && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => setShowInfoRequest(true)}>
              Request More Info
            </Button>
          )}

          {/* SUPER_ADMIN override */}
          {isSuperAdmin && !["CLOSED_SUCCESS", "CANCELLED"].includes(currentStatus) && (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setShowOverride(true)}
            >
              <ShieldAlert size={13} />
              Admin Override
            </Button>
          )}

          {/* Cancel */}
          {canCancel && (
            <Button size="sm" variant="danger" className="w-full" onClick={() => setShowCancel(true)}>
              <XCircle size={13} />
              Cancel Project
            </Button>
          )}
        </div>

        {/* What's needed to advance */}
        {exitCriteria && exitCriteria.criteria.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#e2e4f0]">
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-2">What&apos;s Needed to Advance</p>
            {exitCriteria.criteria.map((c) => (
              <div key={c.toStatus} className="mb-2">
                <p className="text-[10px] font-600 text-gray-500 mb-1">→ {c.label}</p>
                <ul className="space-y-1">
                  {(c.pending.length === 0 ? [] : c.pending).map((item, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                  {c.met && (
                    <li className="text-xs text-green-700 flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="flex-shrink-0" />
                      All criteria met
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Request Modal */}
      <Modal open={showInfoRequest} onClose={() => setShowInfoRequest(false)} title="Request More Information">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Describe what additional information you need from the client.</p>
          <Textarea
            label="Message to Client"
            value={infoMessage}
            onChange={(e) => setInfoMessage(e.target.value)}
            placeholder="Please provide more details about..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInfoRequest(false)}>Cancel</Button>
            <Button loading={loading === "INFO_REQUIRED"} onClick={() => doTransition("INFO_REQUIRED", { infoRequestMessage: infoMessage })}>
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel Project">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for cancellation. This will be visible to all parties.</p>
          <Textarea
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Project is no longer needed because..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancel(false)}>Back</Button>
            <Button variant="danger" loading={loading === "CANCELLED"} onClick={() => doTransition("CANCELLED", { cancelledReason: cancelReason })}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin Override Modal */}
      <Modal open={showOverride} onClose={() => setShowOverride(false)} title="Admin Status Override">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs font-600 text-red-700">This bypasses all role checks and exit criteria. Use with caution.</p>
          </div>
          <div>
            <label className="block text-xs font-600 text-gray-700 mb-1">Override to Status</label>
            <select
              className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
              value={overrideToStatus}
              onChange={(e) => setOverrideToStatus(e.target.value)}
            >
              <option value="">Select target status...</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <Textarea
            label="Override Reason *"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain why this override is necessary..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowOverride(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={loading === "override"}
              disabled={!overrideReason || !overrideToStatus}
              onClick={doOverride}
            >
              <ShieldAlert size={13} />
              Apply Override
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Document Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
        <div className="space-y-4">
          <Select
            label="Document Type"
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            options={[
              { value: "SOW_DRAFT", label: "SOW Draft" },
              { value: "SIGNED_SOW", label: "Signed SOW" },
              { value: "STAFFING_ORDER", label: "Staffing Order" },
              { value: "PO", label: "Purchase Order" },
              { value: "COMMERCIAL", label: "Commercial" },
              { value: "OTHER", label: "Other" },
            ]}
          />
          <div>
            <label className="block text-xs font-600 text-gray-700 mb-1">File</label>
            <input
              type="file"
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-600 file:bg-[#1a1f5e] file:text-white hover:file:bg-[#12174a] cursor-pointer"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setUploadFile(f);
                if (f && !uploadName) setUploadName(f.name);
              }}
            />
          </div>
          {uploadFile && (
            <div>
              <label className="block text-xs font-600 text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button loading={loading === "upload"} disabled={!uploadFile} onClick={handleUpload}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
