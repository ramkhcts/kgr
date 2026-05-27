"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { format } from "date-fns";
import { PlusCircle, CheckCircle2, FileText } from "lucide-react";

type InvoiceMilestone = {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  dueDate: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
  status: string;
};

interface Props {
  projectId: string;
  initialMilestones: InvoiceMilestone[];
  userRole: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING:  { label: "Pending",  className: "bg-gray-100 text-gray-600" },
  INVOICED: { label: "Invoiced", className: "bg-blue-100 text-blue-700" },
  PAID:     { label: "Paid",     className: "bg-green-100 text-green-700" },
};

export function InvoiceMilestonesPanel({ projectId, initialMilestones, userRole }: Props) {
  const [milestones, setMilestones] = useState<InvoiceMilestone[]>(initialMilestones);
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const canEdit = ["PMO_LEAD", "SUPER_ADMIN"].includes(userRole);

  async function handleAdd() {
    if (!description || !amount) return;
    setLoading("add");
    try {
      const res = await fetch(`/api/projects/${projectId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount: parseFloat(amount), dueDate: dueDate || null }),
      });
      if (res.ok) {
        const milestone = await res.json();
        setMilestones((prev) => [...prev, milestone]);
        setShowAdd(false);
        setDescription("");
        setAmount("");
        setDueDate("");
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleStatusChange(milestoneId: string, newStatus: string) {
    setLoading("status-" + milestoneId);
    try {
      const res = await fetch(`/api/projects/${projectId}/invoices/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, ...updated } : m));
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Invoice Milestones</p>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
            <PlusCircle size={13} />
            Add Milestone
          </Button>
        )}
      </div>

      {showAdd && canEdit && (
        <div className="mb-4 p-3 rounded-xl border border-[#e2e4f0] bg-[#f4f5fb] space-y-2.5">
          <p className="text-xs font-700 text-[#1a1f5e]">New Milestone</p>
          <Input
            label="Description *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Phase 1 Completion"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Amount *"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" loading={loading === "add"} disabled={!description || !amount} onClick={handleAdd}>
              Add Milestone
            </Button>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No invoice milestones yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e2e4f0]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f4f5fb] border-b border-[#e2e4f0]">
                <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Description</th>
                <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Amount</th>
                <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Due Date</th>
                <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Status</th>
                {canEdit && <th className="px-3 py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const badge = STATUS_BADGE[m.status] ?? STATUS_BADGE.PENDING;
                return (
                  <tr key={m.id} className="border-b border-[#e2e4f0] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-800">{m.description}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-sm font-600 text-gray-800 whitespace-nowrap">
                      ${m.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {m.dueDate ? format(new Date(m.dueDate), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-600 ${badge.className}`}>
                        {m.status === "PAID" && <CheckCircle2 size={10} className="mr-1" />}
                        {badge.label}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          {m.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              loading={loading === "status-" + m.id}
                              onClick={() => handleStatusChange(m.id, "INVOICED")}
                            >
                              Mark Invoiced
                            </Button>
                          )}
                          {m.status === "INVOICED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              loading={loading === "status-" + m.id}
                              onClick={() => handleStatusChange(m.id, "PAID")}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
