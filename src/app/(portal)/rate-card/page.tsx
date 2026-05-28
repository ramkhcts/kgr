"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const SCOPE_OPTIONS = [
  { value: "SITE_SUPPORT_SERVICES", label: "Site Support Services" },
  { value: "SERVICE_DESK", label: "Service Desk" },
  { value: "REMOTE_COMMAND_CENTER", label: "Remote Command Center" },
  { value: "FIELD_SERVICES", label: "Field Services" },
];

const REGION_OPTIONS = [
  { value: "NA", label: "North America" },
  { value: "EMEA", label: "EMEA" },
  { value: "LATAM", label: "Latin America" },
  { value: "ASPAC", label: "Asia Pacific" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
  { value: "AUD", label: "AUD" },
];

const SCOPE_LABELS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};

const REGION_LABELS: Record<string, string> = {
  NA: "North America",
  EMEA: "EMEA",
  LATAM: "Latin America",
  ASPAC: "Asia Pacific",
};

type RateCard = {
  id: string;
  serviceType: string;
  roleName: string;
  hourlyRate: number;
  dailyRate: number;
  currency: string;
  region: string;
  isActive: boolean;
  monthlyRate?: number;
};

type FormState = {
  serviceType: string;
  roleName: string;
  hourlyRate: string;
  dailyRate: string;
  currency: string;
  region: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  serviceType: "SITE_SUPPORT_SERVICES",
  roleName: "",
  hourlyRate: "",
  dailyRate: "",
  currency: "USD",
  region: "NA",
  isActive: true,
};

export default function RateCardPage() {
  const [entries, setEntries] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPMO, setIsPMO] = useState(false);
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [activeOnly, setActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<RateCard | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<RateCard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if PMO by fetching session
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        const role = data?.user?.role ?? "";
        setIsPMO(["PMO_LEAD", "SUPER_ADMIN"].includes(role));
      })
      .catch(() => {});

    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch("/api/rate-card");
      if (!res.ok) throw new Error("Failed to load");
      const data: RateCard[] = await res.json();
      const withMonthly = data.map((e) => ({ ...e, monthlyRate: e.dailyRate * 22 }));
      setEntries(withMonthly);
    } catch {
      setError("Failed to load rate cards");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditEntry(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(entry: RateCard) {
    setEditEntry(entry);
    setForm({
      serviceType: entry.serviceType,
      roleName: entry.roleName,
      hourlyRate: String(entry.hourlyRate),
      dailyRate: String(entry.dailyRate),
      currency: entry.currency,
      region: entry.region,
      isActive: entry.isActive,
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const body = {
        serviceType: form.serviceType,
        roleName: form.roleName,
        hourlyRate: parseFloat(form.hourlyRate),
        dailyRate: parseFloat(form.dailyRate),
        currency: form.currency,
        region: form.region,
        isActive: form.isActive,
      };

      const url = editEntry ? `/api/rate-card/${editEntry.id}` : "/api/rate-card";
      const method = editEntry ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Save failed");
        return;
      }

      setShowModal(false);
      await loadEntries();
    } catch {
      setError("Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(entry: RateCard) {
    try {
      await fetch(`/api/rate-card/${entry.id}`, { method: "DELETE" });
      setConfirmDeactivate(null);
      await loadEntries();
    } catch {
      // non-critical
    }
  }

  const filtered = entries.filter((e) => {
    if (regionFilter !== "ALL" && e.region !== regionFilter) return false;
    if (scopeFilter !== "ALL" && e.serviceType !== scopeFilter) return false;
    if (activeOnly && !e.isActive) return false;
    return true;
  });

  // Group by scope
  const byScopeMap = new Map<string, RateCard[]>();
  for (const e of filtered) {
    const key = e.serviceType;
    if (!byScopeMap.has(key)) byScopeMap.set(key, []);
    byScopeMap.get(key)!.push(e);
  }

  const scopes = Array.from(byScopeMap.keys()).sort();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-800 text-[#1a1f5e]">Rate Cards</h1>
          <p className="text-sm text-gray-500">Pre-agreed rates per MSA — all regions</p>
        </div>
        {isPMO && (
          <Button onClick={openAdd}>+ Add Rate</Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="text-sm border border-[#e2e4f0] rounded-lg px-3 py-1.5 bg-white text-[#1a1f5e] focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
        >
          <option value="ALL">All Regions</option>
          <option value="NA">North America</option>
          <option value="EMEA">EMEA</option>
          <option value="LATAM">Latin America</option>
          <option value="ASPAC">Asia Pacific</option>
        </select>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="text-sm border border-[#e2e4f0] rounded-lg px-3 py-1.5 bg-white text-[#1a1f5e] focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
        >
          <option value="ALL">All Scopes</option>
          {SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="accent-[#1a1f5e]"
          />
          Active only
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No rate cards match the current filters.</p>
      ) : (
        <div className="space-y-6">
          {scopes.map((scope) => {
            const rows = byScopeMap.get(scope)!;
            return (
              <div key={scope}>
                {/* Scope header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 border-t border-[#e2e4f0]" />
                  <span className="text-xs font-700 text-[#1a1f5e] uppercase tracking-widest whitespace-nowrap">
                    {SCOPE_LABELS[scope] ?? scope}
                  </span>
                  <div className="flex-1 border-t border-[#e2e4f0]" />
                </div>

                <div className="rounded-2xl border border-[#e2e4f0] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f4f5fb]">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Role Name</th>
                        <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden sm:table-cell">Scope</th>
                        <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Region</th>
                        <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Currency</th>
                        <th className="text-right px-4 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Daily Rate</th>
                        <th className="text-right px-4 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden md:table-cell">Monthly Rate</th>
                        <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Status</th>
                        {isPMO && <th className="px-4 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                          <td className="px-4 py-2.5 font-600 text-[#1a1f5e]">{row.roleName}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs hidden sm:table-cell">{SCOPE_LABELS[row.serviceType] ?? row.serviceType}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{REGION_LABELS[row.region] ?? row.region}</td>
                          <td className="px-4 py-2.5 text-gray-600">{row.currency}</td>
                          <td className="px-4 py-2.5 text-right font-600 text-[#1a1f5e]">{row.dailyRate.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600 hidden md:table-cell">
                            {((row.monthlyRate ?? row.dailyRate * 22)).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-600 ${
                              row.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {row.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          {isPMO && (
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEdit(row)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-600 text-[#1a1f5e] hover:bg-[#f4f5fb] transition-colors border border-[#e2e4f0]"
                                >
                                  Edit
                                </button>
                                {row.isActive && (
                                  <button
                                    onClick={() => setConfirmDeactivate(row)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-600 text-red-600 hover:bg-red-50 transition-colors border border-red-200"
                                  >
                                    Deactivate
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editEntry ? "Edit Rate Card" : "Add Rate Card"}
        size="md"
      >
        <div className="space-y-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Role Name *"
                placeholder="e.g. L1 Desktop Support Technician"
                value={form.roleName}
                onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Scope *</label>
              <Select
                options={SCOPE_OPTIONS}
                value={form.serviceType}
                onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Region *</label>
              <Select
                options={REGION_OPTIONS}
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              />
            </div>
            <Input
              label="Hourly Rate *"
              type="number"
              min={0}
              value={form.hourlyRate}
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
            />
            <Input
              label="Daily Rate *"
              type="number"
              min={0}
              value={form.dailyRate}
              onChange={(e) => setForm((f) => ({ ...f, dailyRate: e.target.value }))}
            />
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Currency *</label>
              <Select
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Monthly Rate (computed)</label>
              <p className="text-sm font-600 text-gray-700 py-2">
                {form.dailyRate ? (parseFloat(form.dailyRate) * 22).toLocaleString() : "—"}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editEntry ? "Save Changes" : "Add Rate Card"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Deactivate */}
      <Modal
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        title="Deactivate Rate Card"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to deactivate <strong>{confirmDeactivate?.roleName}</strong>?
          This will hide it from active rate cards but preserve historical data.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmDeactivate && handleDeactivate(confirmDeactivate)}>
            Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
