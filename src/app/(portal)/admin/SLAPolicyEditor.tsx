"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SLAPolicy {
  id: string;
  status: string;
  targetDays: number;
  warningDays: number;
  isActive: boolean;
}

interface SLAPolicyEditorProps {
  initialPolicies: SLAPolicy[];
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SLAPolicyEditor({ initialPolicies }: SLAPolicyEditorProps) {
  const [policies, setPolicies] = useState<SLAPolicy[]>(initialPolicies);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function updateField(id: string, field: "targetDays" | "warningDays", value: string) {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: Number(value) } : p))
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/admin/sla-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policies: policies.map((p) => ({
            id: p.id,
            targetDays: p.targetDays,
            warningDays: p.warningDays,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to save SLA policies");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#e2e4f0] overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #1a1f5e08, #3d2d8e0a)" }}
      >
        <div>
          <p className="text-sm font-700 text-[#1a1f5e]">SLA Target Days</p>
          <p className="text-xs text-gray-500">Configure response time targets and warning thresholds for each stage</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f5fb]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Stage</th>
              <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide w-40">Target Days</th>
              <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide w-40">Warning Days</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy, i) => (
              <tr key={policy.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                <td className="px-5 py-3 font-600 text-[#1a1f5e]">{formatStatus(policy.status)}</td>
                <td className="px-5 py-2.5">
                  <input
                    type="number"
                    min={1}
                    value={policy.targetDays}
                    onChange={(e) => updateField(policy.id, "targetDays", e.target.value)}
                    className="w-24 rounded-lg border border-[#e2e4f0] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-[#1a1f5e] focus:ring-1 focus:ring-[#1a1f5e]/20"
                  />
                </td>
                <td className="px-5 py-2.5">
                  <input
                    type="number"
                    min={0}
                    value={policy.warningDays}
                    onChange={(e) => updateField(policy.id, "warningDays", e.target.value)}
                    className="w-24 rounded-lg border border-[#e2e4f0] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-[#1a1f5e] focus:ring-1 focus:ring-[#1a1f5e]/20"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#e2e4f0] flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          <span className="font-600">Target Days</span> = days before SLA breach ·{" "}
          <span className="font-600">Warning Days</span> = days before target to show warning
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {saved && (
            <div className="flex items-center gap-1.5 text-green-700 text-xs font-600">
              <CheckCircle2 size={13} />
              Saved
            </div>
          )}
          <Button size="sm" loading={saving} onClick={handleSave}>
            Save All
          </Button>
        </div>
      </div>
    </div>
  );
}
