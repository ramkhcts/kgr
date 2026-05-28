"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SCOPE_OPTIONS = [
  { value: "SITE_SUPPORT_SERVICES", label: "Site Support Services" },
  { value: "SERVICE_DESK", label: "Service Desk" },
  { value: "REMOTE_COMMAND_CENTER", label: "Remote Command Center" },
  { value: "FIELD_SERVICES", label: "Field Services" },
];
const SCOPE_LABELS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};

const REGION_OPTIONS = [
  { value: "NA", label: "North America" },
  { value: "EMEA", label: "EMEA" },
  { value: "LATAM", label: "Latin America" },
  { value: "ASPAC", label: "Asia Pacific" },
];

const PRIORITY_OPTIONS = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const COVERAGE_OPTIONS = [
  { value: "STANDARD_8X5", label: "Standard (8×5)" },
  { value: "EXTENDED_12X5", label: "Extended (12×5)" },
  { value: "HOURS_24X7", label: "24×7" },
  { value: "FOLLOW_THE_SUN", label: "Follow the Sun" },
];

const WORKPLACE_OPTIONS = [
  { value: "ON_SITE", label: "On-Site Only" },
  { value: "ONSHORE_REMOTE", label: "Onshore Remote" },
  { value: "OFFSHORE_REMOTE", label: "Offshore Remote" },
  { value: "HYBRID_ON_SITE_ONSHORE", label: "Hybrid — On-Site + Onshore" },
  { value: "HYBRID_ON_SITE_OFFSHORE", label: "Hybrid — On-Site + Offshore" },
  { value: "HYBRID_ONSHORE_OFFSHORE", label: "Hybrid — Onshore + Offshore" },
  { value: "HYBRID_ALL", label: "Hybrid — On-Site + Onshore + Offshore" },
];

const CONTRACT_TYPE_OPTIONS = [
  { value: "TIME_AND_MATERIALS", label: "Time & Materials" },
  { value: "FIXED_PRICE", label: "Fixed Price" },
  { value: "MANAGED_SERVICE", label: "Managed Service" },
  { value: "NOT_SURE", label: "Not Sure Yet" },
];

const SERVICE_TIER_OPTIONS = [
  { value: "BASIC", label: "Basic" },
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

type Template = {
  id: string;
  name: string;
  description?: string | null;
  scopeOfWork: string;
  coverageModel?: string | null;
  workplaceModel?: string | null;
  numberOfFtes?: number | null;
  region: string;
  contractType?: string | null;
  serviceTier?: string | null;
  priority: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string };
};

type FormState = {
  name: string;
  description: string;
  scopeOfWork: string;
  coverageModel: string;
  workplaceModel: string;
  numberOfFtes: string;
  region: string;
  contractType: string;
  serviceTier: string;
  priority: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  scopeOfWork: "SITE_SUPPORT_SERVICES",
  coverageModel: "",
  workplaceModel: "",
  numberOfFtes: "",
  region: "NA",
  contractType: "",
  serviceTier: "",
  priority: "MEDIUM",
  notes: "",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState<Template | null>(null);

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch {
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditTemplate(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(t: Template) {
    setEditTemplate(t);
    setForm({
      name: t.name,
      description: t.description ?? "",
      scopeOfWork: t.scopeOfWork,
      coverageModel: t.coverageModel ?? "",
      workplaceModel: t.workplaceModel ?? "",
      numberOfFtes: t.numberOfFtes != null ? String(t.numberOfFtes) : "",
      region: t.region,
      contractType: t.contractType ?? "",
      serviceTier: t.serviceTier ?? "",
      priority: t.priority,
      notes: t.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        scopeOfWork: form.scopeOfWork,
        coverageModel: form.coverageModel || null,
        workplaceModel: form.workplaceModel || null,
        numberOfFtes: form.numberOfFtes ? parseInt(form.numberOfFtes) : null,
        region: form.region,
        contractType: form.contractType || null,
        serviceTier: form.serviceTier || null,
        priority: form.priority,
        notes: form.notes || null,
      };
      const url = editTemplate ? `/api/templates/${editTemplate.id}` : "/api/templates";
      const method = editTemplate ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Save failed");
        return;
      }
      setShowModal(false);
      await loadTemplates();
    } catch {
      setError("Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(t: Template) {
    await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
    setConfirmDeactivate(null);
    await loadTemplates();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin" className="mt-1 p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors flex-shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-800 text-[#1a1f5e]">Project Templates</h1>
              <p className="text-sm text-gray-500">Reusable templates to pre-fill intake form fields</p>
            </div>
            <Button onClick={openAdd}>+ Add Template</Button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-[#e2e4f0] p-8 text-center">
          <p className="text-sm text-gray-400">No templates yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e2e4f0] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f4f5fb]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden sm:table-cell">Scope</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden md:table-cell">FTEs</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden lg:table-cell">Created By</th>
                <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t, i) => (
                <tr key={t.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                  <td className="px-4 py-3 font-600 text-[#1a1f5e]">
                    <p>{t.name}</p>
                    {t.description && <p className="text-xs text-gray-400 font-400 truncate max-w-xs">{t.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">{SCOPE_LABELS[t.scopeOfWork] ?? t.scopeOfWork}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{t.numberOfFtes != null ? `${t.numberOfFtes} FTE${t.numberOfFtes !== 1 ? "s" : ""}` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{t.createdBy?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{format(new Date(t.createdAt), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="px-2.5 py-1 rounded-lg text-xs font-600 text-[#1a1f5e] hover:bg-[#f4f5fb] border border-[#e2e4f0] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(t)}
                        className="px-2.5 py-1 rounded-lg text-xs font-600 text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTemplate ? "Edit Template" : "Add Template"} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Template Name *" placeholder="e.g. Standard Service Desk — NA" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Textarea label="Description" placeholder="Optional description of when to use this template" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Scope of Work *</label>
              <Select options={SCOPE_OPTIONS} value={form.scopeOfWork} onChange={(e) => setForm((f) => ({ ...f, scopeOfWork: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Region</label>
              <Select options={REGION_OPTIONS} value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Coverage Model</label>
              <Select options={[{ value: "", label: "Not specified" }, ...COVERAGE_OPTIONS]} value={form.coverageModel} onChange={(e) => setForm((f) => ({ ...f, coverageModel: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Workplace Model</label>
              <Select options={[{ value: "", label: "Not specified" }, ...WORKPLACE_OPTIONS]} value={form.workplaceModel} onChange={(e) => setForm((f) => ({ ...f, workplaceModel: e.target.value }))} />
            </div>
            <Input label="Number of FTEs" type="number" min={1} value={form.numberOfFtes} onChange={(e) => setForm((f) => ({ ...f, numberOfFtes: e.target.value }))} />
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Priority</label>
              <Select options={PRIORITY_OPTIONS} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Contract Type</label>
              <Select options={[{ value: "", label: "Not specified" }, ...CONTRACT_TYPE_OPTIONS]} value={form.contractType} onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Service Tier</label>
              <Select options={[{ value: "", label: "Not specified" }, ...SERVICE_TIER_OPTIONS]} value={form.serviceTier} onChange={(e) => setForm((f) => ({ ...f, serviceTier: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Textarea label="Notes" placeholder="Additional notes for teams using this template" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e4f0] mt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editTemplate ? "Save Changes" : "Create Template"}</Button>
        </div>
      </Modal>

      {/* Confirm Deactivate */}
      <Modal open={!!confirmDeactivate} onClose={() => setConfirmDeactivate(null)} title="Deactivate Template" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to deactivate <strong>{confirmDeactivate?.name}</strong>? It will no longer appear in the template picker.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmDeactivate && handleDeactivate(confirmDeactivate)}>Deactivate</Button>
        </div>
      </Modal>
    </div>
  );
}
