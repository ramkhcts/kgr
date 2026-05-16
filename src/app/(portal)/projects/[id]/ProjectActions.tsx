"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { getAvailableTransitions, CANCEL_ALLOWED_ROLES } from "@/lib/workflow";
import { ProjectStatus, UserRole, RAGStatus } from "@/types/enums";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { FileText, UserCheck, XCircle, ArrowRight, Upload } from "lucide-react";

type DocumentMeta = { id: string; name: string; type: string };

type Project = {
  id: string;
  status: string;
  ragStatus: string;
  documents?: DocumentMeta[];
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
  const [cancelReason, setCancelReason] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [ragStatus, setRagStatus] = useState(project.ragStatus);
  const [notes, setNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("OTHER");
  const [uploadName, setUploadName] = useState("");

  const currentStatus = project.status as ProjectStatus;
  const role = userRole as UserRole;
  const transitions = getAvailableTransitions(currentStatus, role);
  const canCancel = CANCEL_ALLOWED_ROLES.includes(role) && !["CLOSED_SUCCESS", "CANCELLED", "HANDED_TO_OPERATIONS"].includes(currentStatus);
  const canUpload = ["PMO_LEAD", "PMO_TEAM"].includes(userRole);

  const sowDoc = project.documents?.find((d) => d.type === "SOW_DRAFT");

  async function doTransition(toStatus: string, extra?: Record<string, unknown>) {
    setLoading(toStatus);
    try {
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, notes, ragStatus, ...extra }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
      setShowInfoRequest(false);
      setShowCancel(false);
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

  return (
    <>
      <Card>
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-3">Actions</p>
        <div className="space-y-2">
          {/* RAG Update — PMO only */}
          {["PMO_LEAD", "PMO_TEAM"].includes(userRole) && (
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
          {currentStatus === "PO_RECEIVED" && ["PMO_LEAD", "PMO_TEAM"].includes(role) && (
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

          {/* Cancel */}
          {canCancel && (
            <Button size="sm" variant="danger" className="w-full" onClick={() => setShowCancel(true)}>
              <XCircle size={13} />
              Cancel Project
            </Button>
          )}
        </div>
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
