"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SignaturePad } from "@/components/sow/SignaturePad";
import { FileText, Download, CheckCircle2 } from "lucide-react";

type DocMeta = { id: string; name: string; type: string };
type Project = { id: string; status: string; documents?: DocMeta[] };

export function SOWPanel({ project, userRole }: { project: Project; userRole: string }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
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

  async function advanceToApproval() {
    await fetch(`/api/projects/${project.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStatus: "SOW_APPROVAL" }),
    });
    router.refresh();
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
          {/* PMO_TEAM: Generate SOW */}
          {userRole === "PMO_TEAM" && project.status === "SOLUTIONING" && (
            <Button className="w-full" loading={generating} onClick={generateSOW}>
              <FileText size={14} />
              Generate SOW PDF
            </Button>
          )}

          {/* View / Download SOW if stored in DB */}
          {sowDoc && (
            <a href={`/api/documents/${sowDoc.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">
                <Download size={14} />
                Download SOW PDF
              </Button>
            </a>
          )}

          {/* PMO Lead/Team: Send for client approval */}
          {["PMO_LEAD", "PMO_TEAM"].includes(userRole) && project.status === "SOW_DRAFT" && sowDoc && (
            <Button className="w-full" onClick={advanceToApproval}>
              Send for Client Approval
            </Button>
          )}

          {/* Client: Sign SOW */}
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
            </>
          )}
        </div>
      )}
    </Card>
  );
}
