"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SignaturePad } from "@/components/sow/SignaturePad";
import { FileText, Download, CheckCircle2, RotateCcw, Sparkles, Copy, Check } from "lucide-react";

type DocMeta = { id: string; name: string; type: string };
type Project = {
  id: string;
  status: string;
  documents?: DocMeta[];
  msaReference?: string | null;
  poValue?: number | null;
  poCurrency?: string | null;
  paymentTermsDays?: number | null;
};

interface AISOWContent {
  executiveSummary: string;
  scopeOfWork: string;
  deliverables: string[];
  resourcePlan: string;
  timeline: string;
  commercials: string;
  assumptions: string[];
  exclusions: string[];
  terms: string;
}

export function SOWPanel({ project, userRole }: { project: Project; userRole: string }) {
  const router = useRouter();
  const [generating, setGenerating]           = useState(false);
  const [sowError, setSOWError]               = useState("");
  const [signing, setSigning]                 = useState(false);
  const [rejecting, setRejecting]             = useState(false);
  const [signed, setSigned]                   = useState(false);
  const [showSignature, setShowSignature]     = useState(false);

  // AI SOW state
  const [aiGenerating, setAIGenerating]       = useState(false);
  const [aiSOW, setAISOW]                     = useState<AISOWContent | null>(null);
  const [showAIModal, setShowAIModal]         = useState(false);
  const [aiError, setAIError]                 = useState("");
  const [copied, setCopied]                   = useState(false);

  const sowDoc = project.documents?.find((d) => d.type === "SOW_DRAFT");

  async function generateSOW() {
    setGenerating(true);
    setSOWError("");
    try {
      const res = await fetch(`/api/projects/${project.id}/sow`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSOWError(data.error || "Failed to generate SOW. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setSOWError("Failed to connect to server. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateAISOW() {
    setAIGenerating(true);
    setAIError("");
    try {
      const res = await fetch("/api/ai/sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.sow) {
        setAIError(data.error ?? "AI generation failed");
        return;
      }
      setAISOW(data.sow);
      setShowAIModal(true);
    } catch {
      setAIError("Failed to connect to AI service");
    } finally {
      setAIGenerating(false);
    }
  }

  function buildFullSOWText(sow: AISOWContent): string {
    const lines: string[] = [];
    lines.push("STATEMENT OF WORK — KGR End User Services\n");
    lines.push("EXECUTIVE SUMMARY\n" + sow.executiveSummary + "\n");
    lines.push("SCOPE OF WORK\n" + sow.scopeOfWork + "\n");
    lines.push("DELIVERABLES\n" + sow.deliverables.map((d, i) => `${i + 1}. ${d}`).join("\n") + "\n");
    lines.push("RESOURCE PLAN\n" + sow.resourcePlan + "\n");
    lines.push("TIMELINE & MILESTONES\n" + sow.timeline + "\n");
    lines.push("COMMERCIAL TERMS\n" + sow.commercials + "\n");
    lines.push("ASSUMPTIONS\n" + sow.assumptions.map((a, i) => `${i + 1}. ${a}`).join("\n") + "\n");
    lines.push("EXCLUSIONS\n" + sow.exclusions.map((e, i) => `${i + 1}. ${e}`).join("\n") + "\n");
    lines.push("TERMS & CONDITIONS\n" + sow.terms);
    return lines.join("\n");
  }

  async function copySOW() {
    if (!aiSOW) return;
    await navigator.clipboard.writeText(buildFullSOWText(aiSOW));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <>
      <Card>
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">SOW Actions</p>

        {/* MSA reference */}
        {project.msaReference && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-[#f4f5fb] border border-[#e2e4f0]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-600">Governing Agreement</p>
            <p className="text-sm font-600 text-[#1a1f5e] mt-0.5">{project.msaReference}</p>
          </div>
        )}

        {/* SOW generation error */}
        {sowError && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-700">{sowError}</p>
          </div>
        )}

        {signed ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="text-base font-700 text-[#1a1f5e]">SOW Signed Successfully</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* ── PMO_TEAM / PMO_LEAD in SOLUTIONING: Generate SOW (standard + AI) ── */}
            {["PMO_TEAM", "PMO_LEAD", "SUPER_ADMIN"].includes(userRole) && project.status === "SOLUTIONING" && (
              <div className="space-y-2">
                <Button className="w-full" loading={generating} onClick={generateSOW}>
                  <FileText size={14} />
                  Generate SOW PDF
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#e2e4f0]" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="px-2 bg-white text-gray-400 uppercase tracking-wide">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-[#3d2d8e]/30 text-[#3d2d8e] hover:bg-[#3d2d8e]/5"
                  loading={aiGenerating}
                  onClick={generateAISOW}
                >
                  <Sparkles size={14} />
                  ✨ Draft SOW with AI
                </Button>

                {aiError && (
                  <p className="text-xs text-red-600 text-center">{aiError}</p>
                )}

                <p className="text-[10px] text-gray-400 text-center leading-snug">
                  AI generates a professional SOW draft based on project scope and rate card
                </p>
              </div>
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

      {/* ── AI SOW Preview Modal ──────────────────────────────────── */}
      <Modal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        title="✨ AI-Generated SOW Draft"
      >
        {aiSOW && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e4f0]">
              <p className="text-xs text-gray-500">
                Review and incorporate into your SOW PDF. Copy all sections or use as a reference.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={copySOW}
                className="flex-shrink-0"
              >
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy All"}
              </Button>
            </div>

            {[
              { title: "Executive Summary", content: aiSOW.executiveSummary },
              { title: "Scope of Work", content: aiSOW.scopeOfWork },
              { title: "Resource Plan", content: aiSOW.resourcePlan },
              { title: "Timeline & Milestones", content: aiSOW.timeline },
              { title: "Commercial Terms", content: aiSOW.commercials },
              { title: "Terms & Conditions", content: aiSOW.terms },
            ].map(({ title, content }) => (
              <div key={title}>
                <p className="text-[11px] font-700 text-[#1a1f5e] uppercase tracking-wide mb-1.5">{title}</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
              </div>
            ))}

            {/* Payment Terms section */}
            <div>
              <p className="text-[11px] font-700 text-[#1a1f5e] uppercase tracking-wide mb-1.5">Payment Terms</p>
              {project.paymentTermsDays || project.poValue ? (
                <div className="space-y-0.5 text-sm text-gray-700">
                  <p>Net {project.paymentTermsDays ?? 30} days</p>
                  {project.poValue && (
                    <p>
                      PO Value: {project.poCurrency ?? "USD"} {project.poValue.toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">To be confirmed.</p>
              )}
            </div>

            {aiSOW.deliverables?.length > 0 && (
              <div>
                <p className="text-[11px] font-700 text-[#1a1f5e] uppercase tracking-wide mb-1.5">Deliverables</p>
                <ul className="space-y-1">
                  {aiSOW.deliverables.map((d, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-[#1a1f5e] font-600 flex-shrink-0">{i + 1}.</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiSOW.assumptions?.length > 0 && (
              <div>
                <p className="text-[11px] font-700 text-[#1a1f5e] uppercase tracking-wide mb-1.5">Assumptions</p>
                <ul className="space-y-1">
                  {aiSOW.assumptions.map((a, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 flex-shrink-0">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiSOW.exclusions?.length > 0 && (
              <div>
                <p className="text-[11px] font-700 text-[#1a1f5e] uppercase tracking-wide mb-1.5">Exclusions</p>
                <ul className="space-y-1">
                  {aiSOW.exclusions.map((e, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 flex-shrink-0">•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-[#e2e4f0]">
              <p className="text-[10px] text-gray-400">
                Generated by Claude AI · Review before use · Use &quot;Generate SOW PDF&quot; to create the final document
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
