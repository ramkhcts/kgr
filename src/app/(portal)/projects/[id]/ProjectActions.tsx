"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getAvailableTransitions, CANCEL_ALLOWED_ROLES, STATUS_PENDING_WITH } from "@/lib/workflow";
import { ProjectStatus, UserRole, ROLE_LABELS, STATUS_LABELS } from "@/types/enums";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import {
  FileText, UserCheck, XCircle, ArrowRight, Upload,
  AlertTriangle, CheckCircle2, ShieldAlert, Bell, Clock,
  PackageCheck, ClipboardCheck, RotateCcw,
} from "lucide-react";

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
  { value: "RED",   label: "Red — Blocked" },
];

export function ProjectActions({ project, userRole, userId }: {
  project: Project;
  userRole: string;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading]                   = useState<string | null>(null);
  const [showCancel, setShowCancel]             = useState(false);
  const [showInfoRequest, setShowInfoRequest]   = useState(false);
  const [showUpload, setShowUpload]             = useState(false);
  const [showOverride, setShowOverride]         = useState(false);
  const [cancelReason, setCancelReason]         = useState("");
  const [infoMessage, setInfoMessage]           = useState("");
  const [ragStatus, setRagStatus]               = useState(project.ragStatus);
  const [notes, setNotes]                       = useState("");
  const [uploadFile, setUploadFile]             = useState<File | null>(null);
  const [uploadType, setUploadType]             = useState("OTHER");
  const [uploadName, setUploadName]             = useState("");
  const [pendingCriteria, setPendingCriteria]   = useState<string[]>([]);
  const [overrideReason, setOverrideReason]     = useState("");
  const [overrideToStatus, setOverrideToStatus] = useState("");
  const [exitCriteria, setExitCriteria]         = useState<ExitCriteriaResult | null>(null);

  // PO submission (CLIENT + PMO_LEAD at PO_REQUESTED)
  const [poNumber, setPoNumber]         = useState("");
  const [poValue, setPoValue]           = useState("");
  const [poExpiryDate, setPoExpiryDate] = useState("");
  const [poFile, setPoFile]             = useState<File | null>(null);
  const [poCurrency, setPoCurrency]     = useState("USD");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");

  // Closure notes (PMO_LEAD at HANDED_TO_OPERATIONS)
  const [closureNotes, setClosureNotes] = useState("");

  const currentStatus   = project.status as ProjectStatus;
  const role            = userRole as UserRole;
  const isSuperAdmin    = userRole === "SUPER_ADMIN";
  const effectiveRole: UserRole = isSuperAdmin ? "PMO_LEAD" : role;
  const transitions     = getAvailableTransitions(currentStatus, effectiveRole);
  const canCancel       =
    (CANCEL_ALLOWED_ROLES.includes(role) || isSuperAdmin) &&
    !["CLOSED_SUCCESS", "CANCELLED", "HANDED_TO_OPERATIONS"].includes(currentStatus);
  const canUpload       = ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole);
  const sowDoc          = project.documents?.find((d) => d.type === "SOW_DRAFT");
  const isClosed        = ["CLOSED_SUCCESS", "CANCELLED"].includes(currentStatus);

  // "Pending with" logic
  const pendingWith = STATUS_PENDING_WITH[currentStatus];
  const isMyTurn    = pendingWith?.roles.some(
    (r) => r === role || (isSuperAdmin && ["PMO_LEAD", "PMO_TEAM"].includes(r))
  );

  // These transitions have dedicated custom UI — hide generic button
  const CUSTOM_HANDLED: [string, string][] = [
    ["SOLUTIONING",   "SOW_DRAFT"],        // SOW generation page
    ["SOW_APPROVAL",  "SOW_SIGNED"],       // SOW signing page
    ["SOW_APPROVAL",  "SOW_DRAFT"],        // Reject on SOW page
    ["PO_RECEIVED",   "RESOURCE_ASSIGNED"],// Resources assignment page
    ["HANDED_TO_OPERATIONS", "CLOSED_SUCCESS"], // Inline form below
  ];

  // Generic transition buttons: exclude any pair handled by custom UI or inline forms
  const genericTransitions = transitions.filter((t) => {
    if (t.to === "INFO_REQUIRED") return false; // Has modal
    if (CUSTOM_HANDLED.some(([f, to]) => f === t.from && to === t.to)) return false;
    // PO_RECEIVED is inline for both CLIENT and PMO_LEAD
    if (t.to === "PO_RECEIVED") return false;
    return true;
  });

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
        if (data.pending && Array.isArray(data.pending)) setPendingCriteria(data.pending);
      }
    } finally {
      setLoading(null);
      setShowInfoRequest(false);
      setShowCancel(false);
    }
  }

  /** CLIENT or PMO_LEAD submit PO: optionally upload file, then advance status */
  async function handlePOSubmit() {
    if (!poNumber.trim()) return;
    setLoading("PO_RECEIVED");
    setPendingCriteria([]);
    try {
      if (poFile) {
        const fd = new FormData();
        fd.append("file", poFile);
        fd.append("type", "PO");
        fd.append("name", poFile.name);
        await fetch(`/api/projects/${project.id}/documents`, { method: "POST", body: fd });
      }
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus: "PO_RECEIVED",
          poNumber: poNumber.trim(),
          ragStatus,
          poValue: poValue ? parseFloat(poValue) : undefined,
          poExpiryDate: poExpiryDate || undefined,
          poCurrency,
          paymentTermsDays: paymentTermsDays ? parseInt(paymentTermsDays) : 30,
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        if (data.pending) setPendingCriteria(data.pending);
      }
    } finally { setLoading(null); }
  }

  /** PMO_LEAD at HANDED_TO_OPERATIONS: save closure notes then close */
  async function handleCloseProject() {
    if (!closureNotes.trim()) return;
    setLoading("CLOSED_SUCCESS");
    setPendingCriteria([]);
    try {
      // 1. Save closure notes
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closureNotes: closureNotes.trim() }),
      });
      // 2. Advance to CLOSED_SUCCESS
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: "CLOSED_SUCCESS", notes: closureNotes.trim(), ragStatus }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        if (data.pending) setPendingCriteria(data.pending);
      }
    } finally { setLoading(null); }
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
      if (res.ok) { setShowOverride(false); setOverrideReason(""); router.refresh(); }
    } finally { setLoading(null); }
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
      if (res.ok) { setShowUpload(false); setUploadFile(null); setUploadName(""); router.refresh(); }
    } finally { setLoading(null); }
  }

  const allStatuses = [
    "SUBMITTED","UNDER_REVIEW","INFO_REQUIRED","SOLUTIONING","SOW_DRAFT",
    "SOW_APPROVAL","SOW_SIGNED","PO_REQUESTED","PO_RECEIVED","RESOURCE_ASSIGNED",
    "HANDED_TO_OPERATIONS","CLOSED_SUCCESS","CANCELLED",
  ].filter((s) => s !== currentStatus);

  return (
    <>
      <Card>
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-3">Actions</p>

        {/* ══ Pending-with banner ══════════════════════════════════ */}
        {pendingWith && !isClosed && (
          <div className={`mb-4 p-3 rounded-xl border ${
            isMyTurn ? "bg-amber-50 border-amber-300" : "bg-[#f4f5fb] border-[#e2e4f0]"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {isMyTurn
                ? <Bell size={13} className="text-amber-600 flex-shrink-0" />
                : <Clock size={13} className="text-gray-400 flex-shrink-0" />}
              <p className={`text-xs font-700 ${isMyTurn ? "text-amber-700" : "text-gray-500"}`}>
                {isMyTurn
                  ? "Action Required"
                  : `Pending with ${pendingWith.roles.map((r) => ROLE_LABELS[r] ?? r).join(" / ")}`}
              </p>
            </div>
            <p className={`text-xs leading-relaxed ${isMyTurn ? "text-amber-800" : "text-gray-400"}`}>
              {pendingWith.hint}
            </p>
          </div>
        )}

        <div className="space-y-2">

          {/* ── RAG Update (PMO only) ─────────────────────── */}
          {["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole) && (
            <div className="space-y-1.5">
              <Select label="Update RAG Status" options={RAG_OPTIONS} value={ragStatus} onChange={(e) => setRagStatus(e.target.value)} />
              <Button size="sm" variant="outline" className="w-full" onClick={async () => {
                await fetch(`/api/projects/${project.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ragStatus }),
                });
                router.refresh();
              }}>
                Save RAG
              </Button>
            </div>
          )}

          {/* ── STAGE: SOLUTIONING — PMO_TEAM generates SOW ─ */}
          {currentStatus === "SOLUTIONING" && ["PMO_TEAM", "SUPER_ADMIN"].includes(userRole) && (
            <Link href={`/projects/${project.id}/sow`}>
              <Button className="w-full" size="sm">
                <FileText size={14} />
                Generate SOW
              </Button>
            </Link>
          )}

          {/* ── View SOW (anyone if doc exists) ────────────── */}
          {sowDoc && (
            <a href={`/api/documents/${sowDoc.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full" size="sm">
                <FileText size={14} />
                View SOW PDF
              </Button>
            </a>
          )}

          {/* ── STAGE: SOW_APPROVAL ─────────────────────────
               CLIENT: sign or reject on SOW page
               PMO_LEAD: recall to draft on SOW page             */}
          {currentStatus === "SOW_APPROVAL" && (
            <Link href={`/projects/${project.id}/sow`}>
              <Button className="w-full" size="sm">
                {role === "CLIENT" ? <UserCheck size={14} /> : <FileText size={14} />}
                {role === "CLIENT" ? "Review, Sign or Reject SOW" : "View SOW / Recall to Draft"}
              </Button>
            </Link>
          )}

          {/* ── STAGE: INFO_REQUIRED — CLIENT hint ──────────── */}
          {currentStatus === "INFO_REQUIRED" && role === "CLIENT" && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
              <p className="font-700">How to respond</p>
              <p>Post your reply in the <span className="font-600">Updates &amp; Collaboration</span> section, then click <span className="font-600">Info Provided</span> below.</p>
            </div>
          )}

          {/* ── STAGE: PO_REQUESTED — CLIENT inline PO form ─── */}
          {currentStatus === "PO_REQUESTED" && role === "CLIENT" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2.5">
              <p className="text-xs font-700 text-blue-800 flex items-center gap-1.5">
                <PackageCheck size={13} />
                Submit Purchase Order
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="PO Value *"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50000.00"
                  value={poValue}
                  onChange={(e) => setPoValue(e.target.value)}
                />
                <Select
                  label="Currency"
                  value={poCurrency}
                  onChange={(e) => setPoCurrency(e.target.value)}
                  options={[
                    { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" },
                    { value: "GBP", label: "GBP" }, { value: "CAD", label: "CAD" },
                    { value: "AUD", label: "AUD" }, { value: "SGD", label: "SGD" },
                    { value: "INR", label: "INR" }, { value: "BRL", label: "BRL" },
                    { value: "MXN", label: "MXN" }, { value: "JPY", label: "JPY" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="PO Expiry Date"
                  type="date"
                  value={poExpiryDate}
                  onChange={(e) => setPoExpiryDate(e.target.value)}
                />
                <Select
                  label="Payment Terms"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(e.target.value)}
                  options={[
                    { value: "15", label: "Net 15" }, { value: "30", label: "Net 30" },
                    { value: "45", label: "Net 45" }, { value: "60", label: "Net 60" },
                    { value: "90", label: "Net 90" },
                  ]}
                />
              </div>
              <Input
                label="PO Number *"
                placeholder="e.g. PO-2024-00123"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
              />
              <div>
                <label className="text-xs font-600 text-[#1a1f5e] block mb-1">
                  Attach PO Document <span className="text-gray-400 font-400">(optional)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  className="block w-full text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-600 file:bg-[#1a1f5e] file:text-white hover:file:bg-[#12174a] cursor-pointer"
                  onChange={(e) => setPoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {pendingCriteria.length > 0 && (
                <div className="rounded-lg p-2 bg-amber-50 border border-amber-200">
                  {pendingCriteria.map((c, i) => (
                    <p key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle size={11} />{c}
                    </p>
                  ))}
                </div>
              )}
              <Button size="sm" className="w-full" loading={loading === "PO_RECEIVED"} disabled={!poNumber.trim()} onClick={handlePOSubmit}>
                <PackageCheck size={13} />
                Confirm PO &amp; Advance
              </Button>
            </div>
          )}

          {/* ── STAGE: PO_REQUESTED — PMO_LEAD/SUPER_ADMIN confirm PO ── */}
          {currentStatus === "PO_REQUESTED" && ["PMO_LEAD", "SUPER_ADMIN"].includes(userRole) && (
            <div className="rounded-xl border border-[#e2e4f0] bg-[#f4f5fb] p-3 space-y-2.5">
              <p className="text-xs font-700 text-[#1a1f5e] flex items-center gap-1.5">
                <PackageCheck size={13} />
                Confirm PO Received
              </p>
              <p className="text-xs text-gray-500">
                Once the client&apos;s PO is in hand, enter the PO number to advance the project.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="PO Value *"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50000.00"
                  value={poValue}
                  onChange={(e) => setPoValue(e.target.value)}
                />
                <Select
                  label="Currency"
                  value={poCurrency}
                  onChange={(e) => setPoCurrency(e.target.value)}
                  options={[
                    { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" },
                    { value: "GBP", label: "GBP" }, { value: "CAD", label: "CAD" },
                    { value: "AUD", label: "AUD" }, { value: "SGD", label: "SGD" },
                    { value: "INR", label: "INR" }, { value: "BRL", label: "BRL" },
                    { value: "MXN", label: "MXN" }, { value: "JPY", label: "JPY" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="PO Expiry Date"
                  type="date"
                  value={poExpiryDate}
                  onChange={(e) => setPoExpiryDate(e.target.value)}
                />
                <Select
                  label="Payment Terms"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(e.target.value)}
                  options={[
                    { value: "15", label: "Net 15" }, { value: "30", label: "Net 30" },
                    { value: "45", label: "Net 45" }, { value: "60", label: "Net 60" },
                    { value: "90", label: "Net 90" },
                  ]}
                />
              </div>
              <Input
                label="PO Number *"
                placeholder="e.g. PO-2024-00123"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
              />
              <div>
                <label className="text-xs font-600 text-[#1a1f5e] block mb-1">
                  Attach PO Document <span className="text-gray-400 font-400">(optional)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  className="block w-full text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-600 file:bg-[#1a1f5e] file:text-white hover:file:bg-[#12174a] cursor-pointer"
                  onChange={(e) => setPoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {pendingCriteria.length > 0 && (
                <div className="rounded-lg p-2 bg-amber-50 border border-amber-200">
                  {pendingCriteria.map((c, i) => (
                    <p key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle size={11} />{c}
                    </p>
                  ))}
                </div>
              )}
              <Button size="sm" variant="primary" className="w-full" loading={loading === "PO_RECEIVED"} disabled={!poNumber.trim()} onClick={handlePOSubmit}>
                <PackageCheck size={13} />
                Mark PO Received &amp; Advance
              </Button>
            </div>
          )}

          {/* ── STAGE: PO_RECEIVED — Assign Resource ─────────── */}
          {currentStatus === "PO_RECEIVED" && ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole) && (
            <Link href={`/projects/${project.id}/resources`}>
              <Button className="w-full" size="sm">
                <UserCheck size={14} />
                Assign Resource
              </Button>
            </Link>
          )}

          {/* ── STAGE: HANDED_TO_OPERATIONS — Closure notes + Close ── */}
          {currentStatus === "HANDED_TO_OPERATIONS" && ["PMO_LEAD", "SUPER_ADMIN"].includes(userRole) && (
            <div className="rounded-xl border border-[#1a1f5e]/20 bg-[#1a1f5e]/5 p-3 space-y-2.5">
              <p className="text-xs font-700 text-[#1a1f5e] flex items-center gap-1.5">
                <ClipboardCheck size={13} />
                Close Project
              </p>
              <p className="text-xs text-gray-600">
                Add closure notes summarising the outcome before marking this project complete.
              </p>
              <Textarea
                label="Closure Notes *"
                placeholder="Project delivered successfully. Resources stood up on [date]. Client signed off..."
                rows={3}
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
              />
              {pendingCriteria.length > 0 && (
                <div className="rounded-lg p-2 bg-amber-50 border border-amber-200">
                  {pendingCriteria.map((c, i) => (
                    <p key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle size={11} />{c}
                    </p>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                loading={loading === "CLOSED_SUCCESS"}
                disabled={!closureNotes.trim()}
                onClick={handleCloseProject}
              >
                <ClipboardCheck size={13} />
                Save Notes &amp; Close Project
              </Button>
            </div>
          )}

          {/* ── Upload document (PMO only) ────────────────────── */}
          {canUpload && !isClosed && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => setShowUpload(true)}>
              <Upload size={13} />
              Upload Document
            </Button>
          )}

          {/* ── Pending criteria (generic — shown when transition attempt fails) ── */}
          {pendingCriteria.length > 0 &&
            !["PO_REQUESTED", "HANDED_TO_OPERATIONS"].includes(currentStatus) && (
            <div className="rounded-lg p-3 bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs font-700 text-amber-700">Cannot advance — items needed:</p>
              </div>
              <ul className="space-y-1">
                {pendingCriteria.map((c, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">•</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Generic workflow transition buttons ──────────── */}
          {genericTransitions.map((t) => (
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

          {/* ── Info request trigger (PMO only) ─────────────── */}
          {transitions.some((t) => t.to === "INFO_REQUIRED") && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => setShowInfoRequest(true)}>
              Request More Info from Client
            </Button>
          )}

          {/* ── SOW rejection shortcut from project detail ───── */}
          {currentStatus === "SOW_APPROVAL" && role === "CLIENT" && (
            <div className="pt-1">
              <p className="text-[10px] text-gray-400 text-center">
                To reject the SOW, click <span className="font-600">&quot;Review, Sign or Reject SOW&quot;</span> above.
              </p>
            </div>
          )}

          {/* ── SUPER_ADMIN override ──────────────────────────── */}
          {isSuperAdmin && !isClosed && (
            <Button size="sm" variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50" onClick={() => setShowOverride(true)}>
              <ShieldAlert size={13} />
              Admin Override
            </Button>
          )}

          {/* ── Cancel ───────────────────────────────────────── */}
          {canCancel && (
            <Button size="sm" variant="danger" className="w-full" onClick={() => setShowCancel(true)}>
              <XCircle size={13} />
              Cancel Project
            </Button>
          )}
        </div>

        {/* ── Exit criteria checklist ──────────────────────── */}
        {exitCriteria && exitCriteria.criteria.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#e2e4f0]">
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-2">What&apos;s Needed to Advance</p>
            {exitCriteria.criteria.map((c) => (
              <div key={c.toStatus} className="mb-2">
                <p className="text-[10px] font-600 text-gray-500 mb-1">→ {c.label}</p>
                <ul className="space-y-1">
                  {c.pending.map((item, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                  {c.met && (
                    <li className="text-xs text-green-700 flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="flex-shrink-0" />All criteria met
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Info Request Modal ─────────────────────────────── */}
      <Modal open={showInfoRequest} onClose={() => setShowInfoRequest(false)} title="Request More Information">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Describe what additional information you need from the client.</p>
          <Textarea label="Message to Client" value={infoMessage} onChange={(e) => setInfoMessage(e.target.value)} placeholder="Please provide more details about..." rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInfoRequest(false)}>Cancel</Button>
            <Button loading={loading === "INFO_REQUIRED"} onClick={() => doTransition("INFO_REQUIRED", { infoRequestMessage: infoMessage })}>
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Cancel Modal ───────────────────────────────────── */}
      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel Project">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for cancellation. This will be visible to all parties.</p>
          <Textarea label="Cancellation Reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Project is no longer needed because..." rows={3} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancel(false)}>Back</Button>
            <Button variant="danger" loading={loading === "CANCELLED"} onClick={() => doTransition("CANCELLED", { cancelledReason: cancelReason })}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Admin Override Modal ───────────────────────────── */}
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
              {allStatuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <Textarea label="Override Reason *" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Explain why this override is necessary..." rows={3} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowOverride(false)}>Cancel</Button>
            <Button variant="danger" loading={loading === "override"} disabled={!overrideReason || !overrideToStatus} onClick={doOverride}>
              <ShieldAlert size={13} />Apply Override
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Upload Document Modal ──────────────────────────── */}
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
            <Button loading={loading === "upload"} disabled={!uploadFile} onClick={handleUpload}>Upload</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
