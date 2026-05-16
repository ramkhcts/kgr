"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getAvailableTransitions, CANCEL_ALLOWED_ROLES } from "@/lib/workflow";
import { ProjectStatus, UserRole, RAGStatus } from "@/types/enums";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { FileText, UserCheck, XCircle, ArrowRight } from "lucide-react";

type Project = {
  id: string;
  status: string;
  ragStatus: string;
  sowDocumentPath: string | null;
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
  const [cancelReason, setCancelReason] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [ragStatus, setRagStatus] = useState(project.ragStatus);
  const [notes, setNotes] = useState("");

  const currentStatus = project.status as ProjectStatus;
  const role = userRole as UserRole;
  const transitions = getAvailableTransitions(currentStatus, role);
  const canCancel = CANCEL_ALLOWED_ROLES.includes(role) && !["CLOSED_SUCCESS", "CANCELLED"].includes(currentStatus);

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

  return (
    <>
      <Card>
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-3">Actions</p>
        <div className="space-y-2">
          {/* RAG Update */}
          {["PROGRAM_MANAGER", "SOLUTIONING_TEAM"].includes(userRole) && (
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

          {/* SOW Actions */}
          {currentStatus === "SOLUTIONING" && role === "SOLUTIONING_TEAM" && (
            <Link href={`/projects/${project.id}/sow`}>
              <Button className="w-full" size="sm">
                <FileText size={14} />
                Generate SOW
              </Button>
            </Link>
          )}

          {(currentStatus === "SOW_DRAFT" || currentStatus === "SOW_APPROVAL") && project.sowDocumentPath && (
            <a href={`/api/uploads/${project.sowDocumentPath}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full" size="sm">
                <FileText size={14} />
                View SOW PDF
              </Button>
            </a>
          )}

          {currentStatus === "SOW_APPROVAL" && role === "CUSTOMER_APPROVER" && (
            <Link href={`/projects/${project.id}/sow`}>
              <Button className="w-full" size="sm">
                <UserCheck size={14} />
                Review & Sign SOW
              </Button>
            </Link>
          )}

          {/* Resource Assignment */}
          {currentStatus === "PO_RECEIVED" && ["PROGRAM_MANAGER", "SOLUTIONING_TEAM"].includes(role) && (
            <Link href={`/projects/${project.id}/resources`}>
              <Button className="w-full" size="sm">
                <UserCheck size={14} />
                Assign Resource
              </Button>
            </Link>
          )}

          {/* Workflow transitions */}
          {transitions
            .filter((t) => !["INFO_REQUIRED", "SOW_DRAFT", "SOW_SIGNED", "RESOURCE_ASSIGNED"].includes(t.to))
            .map((t) => (
              <Button
                key={t.to}
                size="sm"
                variant={t.to === "CLOSED_SUCCESS" ? "secondary" : "primary"}
                className="w-full"
                loading={loading === t.to}
                onClick={() => {
                  if (t.to === "INFO_REQUIRED") {
                    setShowInfoRequest(true);
                  } else {
                    doTransition(t.to);
                  }
                }}
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
          <p className="text-sm text-gray-600">Describe what additional information you need from the requestor.</p>
          <Textarea
            label="Message to Requestor"
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
    </>
  );
}
