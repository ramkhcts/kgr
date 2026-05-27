"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Star, Trash2, Pencil, UserPlus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  specialization?: string | null;
};

type ProjectResource = {
  id: string;
  projectId: string;
  userId: string | null;
  user: { name: string; email: string } | null;
  roleName: string;
  dailyRate: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  isLead: boolean;
  notes: string | null;
};

type RateCardEntry = {
  id: string;
  roleName: string;
  dailyRate: number;
  currency: string;
};

interface Props {
  projectId: string;
  projectStatus: string;
  userRole: string;
  team: TeamMember[];
  initialResources: ProjectResource[];
  rateCards: RateCardEntry[];
}

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

const SPECIALIZATION_COLORS: Record<string, string> = {
  SOLUTIONING: "#7c3aed",
  DELIVERY: "#0369a1",
  COMMERCIAL: "#15803d",
  GENERAL: "#6b7280",
};

const SPECIALIZATION_LABELS: Record<string, string> = {
  SOLUTIONING: "Solutioning",
  DELIVERY: "Delivery",
  COMMERCIAL: "Commercial",
  GENERAL: "General",
};

export function ResourceAssignmentPanel({
  projectId,
  projectStatus,
  userRole,
  team,
  initialResources,
  rateCards,
}: Props) {
  const router = useRouter();
  const [resources, setResources] = useState<ProjectResource[]>(initialResources);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<ProjectResource | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Add form state
  const [roleName, setRoleName] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLead, setIsLead] = useState(false);
  const [notes, setNotes] = useState("");

  // Edit form state
  const [editRoleName, setEditRoleName] = useState("");
  const [editDailyRate, setEditDailyRate] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editIsLead, setEditIsLead] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  const canEdit = ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole);
  const canDelete = ["PMO_LEAD", "SUPER_ADMIN"].includes(userRole);
  const isPOReceived = projectStatus === "PO_RECEIVED";
  const hasLead = resources.some((r) => r.isLead);

  function getRateCardSuggestion(name: string): RateCardEntry | undefined {
    return rateCards.find(
      (rc) => rc.roleName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(rc.roleName.toLowerCase())
    );
  }

  function openAddForm(member: TeamMember) {
    setAddingMemberId(member.id);
    const suggestion = rateCards[0]; // Start with first rate card entry
    setRoleName(suggestion?.roleName ?? "");
    setDailyRate(suggestion ? String(suggestion.dailyRate) : "");
    setCurrency(suggestion?.currency ?? "USD");
    setStartDate("");
    setEndDate("");
    setIsLead(resources.length === 0);
    setNotes("");
  }

  function openEditForm(resource: ProjectResource) {
    setEditingResource(resource);
    setEditRoleName(resource.roleName);
    setEditDailyRate(String(resource.dailyRate));
    setEditCurrency(resource.currency);
    setEditStartDate(resource.startDate ? resource.startDate.slice(0, 10) : "");
    setEditEndDate(resource.endDate ? resource.endDate.slice(0, 10) : "");
    setEditIsLead(resource.isLead);
    setEditNotes(resource.notes ?? "");
  }

  // Update roleName suggestions when user types
  function handleRoleNameChange(value: string) {
    setRoleName(value);
    const suggestion = getRateCardSuggestion(value);
    if (suggestion && !dailyRate) {
      setDailyRate(String(suggestion.dailyRate));
      setCurrency(suggestion.currency);
    }
  }

  async function handleAdd() {
    if (!roleName || !dailyRate) return;
    setLoading("add");
    try {
      const res = await fetch(`/api/projects/${projectId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: addingMemberId,
          roleName,
          dailyRate: parseFloat(dailyRate),
          currency,
          startDate: startDate || null,
          endDate: endDate || null,
          isLead,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        const newResource = await res.json();
        setResources((prev) => {
          const updated = isLead ? prev.map((r) => ({ ...r, isLead: false })) : prev;
          return [...updated, newResource];
        });
        setAddingMemberId(null);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleEdit() {
    if (!editingResource || !editRoleName || !editDailyRate) return;
    setLoading("edit");
    try {
      const res = await fetch(`/api/projects/${projectId}/resources/${editingResource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: editRoleName,
          dailyRate: parseFloat(editDailyRate),
          currency: editCurrency,
          startDate: editStartDate || null,
          endDate: editEndDate || null,
          isLead: editIsLead,
          notes: editNotes || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setResources((prev) => {
          let list = prev.map((r) => r.id === editingResource.id ? { ...r, ...updated } : r);
          if (editIsLead) list = list.map((r) => r.id === editingResource.id ? r : { ...r, isLead: false });
          return list;
        });
        setEditingResource(null);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(resourceId: string) {
    setLoading("delete-" + resourceId);
    try {
      const res = await fetch(`/api/projects/${projectId}/resources/${resourceId}`, { method: "DELETE" });
      if (res.ok) {
        setResources((prev) => {
          const deleted = prev.find((r) => r.id === resourceId);
          let list = prev.filter((r) => r.id !== resourceId);
          // If deleted was lead and there's a next, promote first remaining
          if (deleted?.isLead && list.length > 0) {
            list = list.map((r, idx) => idx === 0 ? { ...r, isLead: true } : r);
          }
          return list;
        });
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleAdvance() {
    setLoading("advance");
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: "RESOURCE_ASSIGNED" }),
      });
      if (res.ok) {
        router.push(`/projects/${projectId}`);
      }
    } finally {
      setLoading(null);
    }
  }

  // Compute running cost
  const totalCost = resources.reduce((sum, r) => {
    if (!r.startDate || !r.endDate) return sum;
    const days = Math.max(
      0,
      Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    return sum + r.dailyRate * days;
  }, 0);

  const addingMember = team.find((m) => m.id === addingMemberId);

  // Members not yet in the team
  const assignedUserIds = new Set(resources.map((r) => r.userId).filter(Boolean));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Add Team Member */}
      {isPOReceived && canEdit && (
        <div>
          <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-3">Available Team Members</p>
          <div className="space-y-2">
            {team.length === 0 && (
              <p className="text-sm text-gray-400">No team members found.</p>
            )}
            {team.map((member) => {
              const alreadyAdded = assignedUserIds.has(member.id);
              const isExpanding = addingMemberId === member.id;
              return (
                <div key={member.id} className="rounded-xl border border-[#e2e4f0] overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-full bg-[#1a1f5e]/10 flex items-center justify-center text-[#1a1f5e] font-700 text-sm flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-600 text-[#1a1f5e]">{member.name}</p>
                        {member.specialization && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-600"
                            style={{
                              backgroundColor: (SPECIALIZATION_COLORS[member.specialization] ?? "#6b7280") + "18",
                              color: SPECIALIZATION_COLORS[member.specialization] ?? "#6b7280",
                            }}
                          >
                            {SPECIALIZATION_LABELS[member.specialization] ?? member.specialization}
                          </span>
                        )}
                        {alreadyAdded && (
                          <CheckCircle2 size={13} className="text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    {!alreadyAdded && !isExpanding && (
                      <Button size="sm" variant="outline" onClick={() => openAddForm(member)}>
                        <UserPlus size={13} />
                        Add
                      </Button>
                    )}
                    {alreadyAdded && !isExpanding && (
                      <Button size="sm" variant="outline" onClick={() => openAddForm(member)}>
                        <UserPlus size={13} />
                        Add Again
                      </Button>
                    )}
                    {isExpanding && (
                      <Button size="sm" variant="outline" onClick={() => setAddingMemberId(null)}>
                        Cancel
                      </Button>
                    )}
                  </div>

                  {/* Inline add form */}
                  {isExpanding && (
                    <div className="border-t border-[#e2e4f0] p-3 bg-[#f4f5fb] space-y-2.5">
                      <p className="text-xs font-700 text-[#1a1f5e]">Add {addingMember?.name} to project</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Role Name *"
                          value={roleName}
                          onChange={(e) => handleRoleNameChange(e.target.value)}
                          placeholder="e.g. Field Tech Lead"
                        />
                        <Input
                          label="Daily Rate *"
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={dailyRate}
                          onChange={(e) => setDailyRate(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          label="Currency"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          options={CURRENCY_OPTIONS}
                        />
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-2 text-xs font-600 text-[#1a1f5e] pb-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isLead}
                              onChange={(e) => setIsLead(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            Set as Lead Resource
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-600 text-[#1a1f5e] mb-1">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
                          />
                        </div>
                      </div>
                      <Textarea
                        label="Notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Any notes about this assignment..."
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setAddingMemberId(null)}>Cancel</Button>
                        <Button
                          size="sm"
                          loading={loading === "add"}
                          disabled={!roleName || !dailyRate}
                          onClick={handleAdd}
                        >
                          Confirm Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isPOReceived && (
            <p className="text-xs text-gray-400 mt-3">Resource assignment is only available in PO_RECEIVED status.</p>
          )}
        </div>
      )}

      {/* RIGHT: Project Team */}
      <div className={isPOReceived && canEdit ? "" : "lg:col-span-2"}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Project Team</p>
          {isPOReceived && hasLead && canEdit && (
            <Button
              size="sm"
              loading={loading === "advance"}
              onClick={handleAdvance}
            >
              Confirm Assignment &amp; Advance
            </Button>
          )}
        </div>

        {!isPOReceived && (
          <div className="mb-3 p-3 rounded-xl bg-[#f4f5fb] border border-[#e2e4f0]">
            <p className="text-xs text-gray-500">
              Resource assignment is enabled only in the <span className="font-600 text-[#1a1f5e]">PO_RECEIVED</span> stage.
              {" "}Current status: <span className="font-600">{projectStatus.replace(/_/g, " ")}</span>
            </p>
          </div>
        )}

        {resources.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            No team members assigned yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-[#e2e4f0]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f4f5fb] border-b border-[#e2e4f0]">
                    <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Name / Role</th>
                    <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Role Name</th>
                    <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Rate</th>
                    <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Lead</th>
                    <th className="text-left px-3 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Duration</th>
                    {canEdit && <th className="px-3 py-2.5"></th>}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id} className="border-b border-[#e2e4f0] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-600 text-[#1a1f5e]">{r.user?.name ?? "(unassigned)"}</p>
                        {r.user?.email && <p className="text-xs text-gray-400">{r.user.email}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700">{r.roleName}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                        {r.currency} {r.dailyRate.toLocaleString()}/d
                      </td>
                      <td className="px-3 py-2.5">
                        {r.isLead ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-600 bg-amber-100 text-amber-700">
                            <Star size={10} fill="currentColor" />
                            Lead
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {r.startDate && r.endDate
                          ? `${format(new Date(r.startDate), "MMM d")} – ${format(new Date(r.endDate), "MMM d")}`
                          : "—"}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditForm(r)}
                              className="p-1.5 rounded-lg hover:bg-[#e8eaf6] text-gray-400 hover:text-[#1a1f5e] transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(r.id)}
                                disabled={loading === "delete-" + r.id}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                              >
                                <Trash2 size={13} />
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

            {/* Running cost total */}
            {totalCost > 0 && (
              <div className="mt-3 flex justify-end">
                <div className="p-3 rounded-xl bg-[#1a1f5e]/5 border border-[#1a1f5e]/10">
                  <p className="text-xs text-gray-500">Estimated Total Cost</p>
                  <p className="text-lg font-800 text-[#1a1f5e]">${totalCost.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">(based on daily rates × duration)</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Resource Modal */}
      <Modal open={!!editingResource} onClose={() => setEditingResource(null)} title="Edit Resource Assignment">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Role Name *"
              value={editRoleName}
              onChange={(e) => setEditRoleName(e.target.value)}
            />
            <Input
              label="Daily Rate *"
              type="number"
              min={0.01}
              step="0.01"
              value={editDailyRate}
              onChange={(e) => setEditDailyRate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Currency"
              value={editCurrency}
              onChange={(e) => setEditCurrency(e.target.value)}
              options={CURRENCY_OPTIONS}
            />
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs font-600 text-[#1a1f5e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsLead}
                  onChange={(e) => setEditIsLead(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Set as Lead Resource
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Start Date</label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">End Date</label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
              />
            </div>
          </div>
          <Textarea
            label="Notes (optional)"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingResource(null)}>Cancel</Button>
            <Button loading={loading === "edit"} disabled={!editRoleName || !editDailyRate} onClick={handleEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
