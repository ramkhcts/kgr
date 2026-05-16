"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SignaturePad } from "@/components/sow/SignaturePad";
import { FileText, Download, CheckCircle2, RotateCcw } from "lucide-react";

type DocMeta = { id: string; name: string; type: string };
type Project = { id: string; status: string; documents?: DocMeta[] };

export function SOWPanel({ project, userRole }: { project: Project; userRole: string }) {
  const router = useRouter();
  const [generating, setGenerating]     = useState(false);
  const [signing, setSigning]           = useState(false);
  const [rejecting, setRejecting]       = useState(false);
  const [signed, setSigned]             = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  const sowDoc = project.documents?.find((d) => d.type === "SOW_DRAFT");

  async function generateSOW() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/sow`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setGenerating(false);
    }
  }

  async function advanceToApproval() {
    await fetch(`/api/projects/${project.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStatus: "SOW_APPROVAL" }),
    });
    router.refresh();
  }

  async function handleSign(dataUrl: string) {
    setSigning(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl: dataUrl }),
      });
      if (res.ok) {
        setSigned(true);
        setTimeout(() => router.push(`/projects/${project.id}`), 1500);
      }
    } finally {
      setSigning(false);
    }
  }

  /** CLIENT or PMO_LEAD rejects SOW — sends back to SOW_DRAFT for revision */
  async function handleReject() {
    setRejecting(true);
    try {
      await fetch(`/api/projects/${project.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: "SOW_DRAFT", notes: "SOW rejected — revision requested" }),
      });
      router.push(`/projects/${project.id}`);
    } finally {
      setRejecting(false);
    }
  }

  return (
    <Card>
      <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">SOW Actions</p>

      {signed ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <CheckCircle2 size={40} className="text-green-500" />
          <p className="text-base font-700 text-[#1a1f5e]">SOW Signed Successfully</p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      ) : (
        <div className="space-y-3">

          {/* ── PMO_TEAM in SOLUTIONING: Generate SOW ── */}
          {["PMO_TEAM", "SUPER_ADMIN"].includes(userRole) && project.status === "SOLUTIONING" && (
            <Button className="w-full" loading={generating} onClick={generateSOW}>
              <FileText size={14} />
              Generate SOW PDF
            </Button>
          )}

          {/* ── Download SOW if available ── */}
          {sowDoc && (
            <a href={`/api/documents/${sowDoc.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">
                <Download size={14} />
                Download SOW PDF
              </Button>
            </a>
          )}

          {/* ── PMO Lead/Team in SOW_DRAFT: Send for approval ── */}
          {["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole) && project.status === "SOW_DRAFT" && sowDoc && (
            <Button className="w-full" onClick={advanceToApproval}>
              Send for Client Approval
            </Button>
          )}

          {/* ── CLIENT in SOW_APPROVAL: Sign or Reject ── */}
          {userRole === "CLIENT" && project.status === "SOW_APPROVAL" && (
            <>
              {!showSignature ? (
                <Button className="w-full" onClick={() => setShowSignature(true)}>
                  Sign SOW Digitally
                </Button>
              ) : (
                <div className="space-y-4">
                  <SignaturePad onSigned={handleSign} />
                  {signing && <p className="text-xs text-center text-gray-500">Saving signature...</p>}
                </div>
              )}

              {!showSignature && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                  <p className="text-xs font-700 text-red-700 flex items-center gap-1.5">
                    <RotateCcw size={12} />
                    Request SOW Revision
                  </p>
                  <p className="text-xs text-red-600">
                    If the SOW needs changes, send it back to KGR for revision.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-red-300 text-red-700 hover:bg-red-100"
                    loading={rejecting}
                    onClick={handleReject}
                  >
                    Reject — Request Revision
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── PMO_LEAD in SOW_APPROVAL: can also reject/recall ── */}
          {["PMO_LEAD", "SUPER_ADMIN"].includes(userRole) && project.status === "SOW_APPROVAL" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs font-700 text-amber-700">Recall for Revision</p>
              <p className="text-xs text-amber-600">
                Withdraw SOW from client approval and send back to draft for edits.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                loading={rejecting}
                onClick={handleReject}
              >
                <RotateCcw size={12} />
                Recall SOW to Draft
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
