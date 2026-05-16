"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { SCOPE_LABELS, REGION_LABELS } from "@/types/enums";
import { WORKING_DAYS, RateCardRow } from "./RateCardRegionTabs";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

const REGION_ORDER = ["NA", "EMEA", "LATAM", "ASPAC"];

const REGION_OPTIONS = REGION_ORDER.map((r) => ({
  value: r,
  label: REGION_LABELS[r] ?? r,
}));

const SCOPE_OPTIONS = [
  { value: "SITE_SUPPORT_SERVICES",  label: "Site Support Services" },
  { value: "SERVICE_DESK",           label: "Service Desk" },
  { value: "REMOTE_COMMAND_CENTER",  label: "Remote Command Center" },
  { value: "FIELD_SERVICES",         label: "Field Services" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

type FormState = {
  region: string;
  serviceType: string;
  roleName: string;
  hourlyRate: string;
  dailyRate: string;
  currency: string;
};

const EMPTY_FORM: FormState = {
  region: "NA",
  serviceType: "SITE_SUPPORT_SERVICES",
  roleName: "",
  hourlyRate: "",
  dailyRate: "",
  currency: "USD",
};

function autoDaily(hourly: string) {
  const h = parseFloat(hourly);
  if (isNaN(h) || h <= 0) return "";
  return (h * 8).toFixed(2);
}

export function RateCardEditor({
  byRegion,
}: {
  byRegion: Record<string, Record<string, RateCardRow[]>>;
}) {
  const router = useRouter();
  const regions = REGION_ORDER.filter((r) => byRegion[r]);
  const [activeRegion, setActiveRegion] = useState(regions[0] ?? "NA");

  // Modal state
  const [showAdd, setShowAdd]         = useState(false);
  const [editEntry, setEditEntry]     = useState<RateCardRow | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<RateCardRow | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const grouped = byRegion[activeRegion] ?? {};

  function openAdd() {
    setForm({ ...EMPTY_FORM, region: activeRegion });
    setError("");
    setShowAdd(true);
  }

  function openEdit(row: RateCardRow) {
    setForm({
      region:      row.region ?? "NA",
      serviceType: row.serviceType,
      roleName:    row.roleName,
      hourlyRate:  String(row.hourlyRate),
      dailyRate:   String(row.dailyRate),
      currency:    row.currency,
    });
    setError("");
    setEditEntry(row);
  }

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-fill daily when hourly changes
      if (key === "hourlyRate" && !prev.dailyRate) {
        next.dailyRate = autoDaily(value);
      }
      return next;
    });
  }

  async function handleAdd() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region:      form.region,
          serviceType: form.serviceType,
          roleName:    form.roleName.trim(),
          hourlyRate:  parseFloat(form.hourlyRate),
          dailyRate:   parseFloat(form.dailyRate),
          currency:    form.currency,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to add role");
        return;
      }
      setShowAdd(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editEntry) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rate-card/${editEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region:      form.region,
          serviceType: form.serviceType,
          roleName:    form.roleName.trim(),
          hourlyRate:  parseFloat(form.hourlyRate),
          dailyRate:   parseFloat(form.dailyRate),
          currency:    form.currency,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to update role");
        return;
      }
      setEditEntry(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteEntry) return;
    setLoading(true);
    try {
      await fetch(`/api/rate-card/${deleteEntry.id}`, { method: "DELETE" });
      setDeleteEntry(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const formValid =
    form.roleName.trim() &&
    !isNaN(parseFloat(form.hourlyRate)) && parseFloat(form.hourlyRate) > 0 &&
    !isNaN(parseFloat(form.dailyRate))  && parseFloat(form.dailyRate)  > 0;

  const previewMonthly = parseFloat(form.dailyRate) > 0
    ? (parseFloat(form.dailyRate) * WORKING_DAYS).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "—";
  const currencySymbol = form.currency === "EUR" ? "€" : "$";

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-700 text-[#1a1f5e]">Manage Rate Card</p>
            <p className="text-xs text-gray-400">Edit roles and rates per region &amp; scope</p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} />
            Add Role
          </Button>
        </div>

        {/* Region tabs */}
        <div className="flex gap-1 mb-4 bg-[#f4f5fb] p-1 rounded-xl w-fit">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRegion(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-600 transition-all ${
                activeRegion === r
                  ? "bg-[#1a1f5e] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#1a1f5e] hover:bg-white/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Tables per scope */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([scope, rows]) => (
            <div key={scope}>
              <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-2">
                {SCOPE_LABELS[scope as keyof typeof SCOPE_LABELS] ?? scope}
              </p>
              <div className="rounded-xl border border-[#e2e4f0] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#f4f5fb]">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-700 text-[#1a1f5e]">Role</th>
                      <th className="text-right px-4 py-2 text-xs font-700 text-[#1a1f5e]">Hourly</th>
                      <th className="text-right px-4 py-2 text-xs font-700 text-[#1a1f5e]">Daily</th>
                      <th className="text-right px-4 py-2 text-xs font-700 text-[#1a1f5e]">Monthly</th>
                      <th className="text-right px-4 py-2 text-xs font-700 text-[#1a1f5e]">CCY</th>
                      <th className="px-4 py-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const sym = row.currency === "EUR" ? "€" : "$";
                      return (
                        <tr key={row.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                          <td className="px-4 py-2.5 font-500 text-gray-800">{row.roleName}</td>
                          <td className="px-4 py-2.5 text-right text-[#1a1f5e] font-600">
                            {sym}{row.hourlyRate.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            {sym}{row.dailyRate.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-700 text-[#16a34a]">
                            {sym}{(row.dailyRate * WORKING_DAYS).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{row.currency}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(row)}
                                className="p-1.5 rounded-lg hover:bg-[#1a1f5e]/10 text-[#1a1f5e] transition-colors"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteEntry(row)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Add / Edit Modal ────────────────────────────────── */}
      <Modal
        open={showAdd || !!editEntry}
        onClose={() => { setShowAdd(false); setEditEntry(null); setError(""); }}
        title={showAdd ? "Add New Role" : "Edit Role"}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Region"
              options={REGION_OPTIONS}
              value={form.region}
              onChange={(e) => updateForm("region", e.target.value)}
            />
            <Select
              label="Scope of Work"
              options={SCOPE_OPTIONS}
              value={form.serviceType}
              onChange={(e) => updateForm("serviceType", e.target.value)}
            />
          </div>

          <Input
            label="Role Name *"
            placeholder="e.g. Senior Field Engineer"
            value={form.roleName}
            onChange={(e) => updateForm("roleName", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hourly Rate *"
              type="number"
              min="0"
              step="0.01"
              placeholder="55.00"
              value={form.hourlyRate}
              onChange={(e) => updateForm("hourlyRate", e.target.value)}
              hint="Daily will auto-fill (hourly × 8)"
            />
            <Input
              label="Daily Rate *"
              type="number"
              min="0"
              step="0.01"
              placeholder="440.00"
              value={form.dailyRate}
              onChange={(e) => updateForm("dailyRate", e.target.value)}
            />
          </div>

          <Select
            label="Currency"
            options={CURRENCY_OPTIONS}
            value={form.currency}
            onChange={(e) => updateForm("currency", e.target.value)}
          />

          {/* Live preview */}
          {formValid && (
            <div className="rounded-xl bg-[#f4f5fb] border border-[#e2e4f0] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 font-600 uppercase tracking-wide">Monthly Rate Preview</p>
                <p className="text-xs text-gray-400">Daily {currencySymbol}{parseFloat(form.dailyRate || "0").toFixed(2)} × {WORKING_DAYS} days</p>
              </div>
              <p className="text-xl font-800 text-[#16a34a]">{currencySymbol}{previewMonthly}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditEntry(null); }}>
              Cancel
            </Button>
            <Button loading={loading} disabled={!formValid} onClick={showAdd ? handleAdd : handleEdit}>
              {showAdd ? "Add Role" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ─────────────────────────────── */}
      <Modal
        open={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        title="Remove Role"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-600 text-red-700">{deleteEntry?.roleName}</p>
              <p className="text-xs text-red-600 mt-0.5">
                {deleteEntry?.serviceType.replace(/_/g, " ")} · {deleteEntry?.region}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            This role will be removed from the rate card. Existing project cost estimates are not affected.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteEntry(null)}>Cancel</Button>
            <Button variant="danger" loading={loading} onClick={handleDelete}>
              <Trash2 size={13} />
              Remove Role
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
