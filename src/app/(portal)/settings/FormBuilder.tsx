"use client";
import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Lock, X,
} from "lucide-react";

interface FormField {
  id: string;
  fieldKey: string;
  label: string;
  type: string;
  required: boolean;
  options: string | null;
  placeholder: string | null;
  hint: string | null;
  section: string;
  sortOrder: number;
  isActive: boolean;
  isCore: boolean;
}

type FieldType = "text" | "number" | "textarea" | "dropdown" | "checkbox" | "date";

interface FieldModalState {
  open: boolean;
  mode: "create" | "edit" | "editOptions";
  field: FormField | null;
}

function toFieldKey(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(" ")
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}

function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

const TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

export function FormBuilder({ initialFields }: { initialFields: FormField[] }) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [modal, setModal] = useState<FieldModalState>({ open: false, mode: "create", field: null });
  const [deleteTarget, setDeleteTarget] = useState<FormField | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state for create/edit modal
  const [fLabel, setFLabel] = useState("");
  const [fKey, setFKey] = useState("");
  const [fType, setFType] = useState<FieldType>("text");
  const [fRequired, setFRequired] = useState(false);
  const [fPlaceholder, setFPlaceholder] = useState("");
  const [fHint, setFHint] = useState("");
  const [fOptions, setFOptions] = useState<string[]>([]);
  const [fNewOption, setFNewOption] = useState("");
  const [fSortOrder, setFSortOrder] = useState(100);

  function openCreate() {
    setFLabel(""); setFKey(""); setFType("text"); setFRequired(false);
    setFPlaceholder(""); setFHint(""); setFOptions([]); setFNewOption(""); setFSortOrder(100);
    setError("");
    setModal({ open: true, mode: "create", field: null });
  }

  function openEdit(field: FormField) {
    setFLabel(field.label);
    setFKey(field.fieldKey);
    setFType(field.type as FieldType);
    setFRequired(field.required);
    setFPlaceholder(field.placeholder ?? "");
    setFHint(field.hint ?? "");
    setFOptions(parseOptions(field.options));
    setFNewOption("");
    setFSortOrder(field.sortOrder);
    setError("");
    setModal({ open: true, mode: "edit", field });
  }

  function openEditOptions(field: FormField) {
    setFOptions(parseOptions(field.options));
    setFNewOption("");
    setError("");
    setModal({ open: true, mode: "editOptions", field });
  }

  function closeModal() {
    setModal({ open: false, mode: "create", field: null });
    setError("");
  }

  const handleLabelChange = useCallback((val: string) => {
    setFLabel(val);
    // Only auto-generate key in create mode
    if (modal.mode === "create") {
      setFKey(toFieldKey(val));
    }
  }, [modal.mode]);

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      if (modal.mode === "create") {
        if (!fLabel.trim() || !fKey.trim() || !fType) {
          setError("Label, field key, and type are required");
          setSaving(false);
          return;
        }
        const payload = {
          label: fLabel.trim(),
          fieldKey: fKey.trim(),
          type: fType,
          required: fRequired,
          placeholder: fPlaceholder.trim() || null,
          hint: fHint.trim() || null,
          options: fType === "dropdown" && fOptions.length > 0 ? fOptions : null,
          sortOrder: fSortOrder,
        };
        const res = await fetch("/api/form-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to create field"); setSaving(false); return; }
        setFields((prev) => [...prev, data].sort((a, b) => a.sortOrder - b.sortOrder));
        closeModal();

      } else if (modal.mode === "edit" && modal.field) {
        const payload: Record<string, unknown> = {
          label: fLabel.trim(),
          required: fRequired,
          placeholder: fPlaceholder.trim() || null,
          hint: fHint.trim() || null,
          sortOrder: fSortOrder,
        };
        if (fType === "dropdown") {
          payload.options = fOptions.length > 0 ? fOptions : null;
        }
        const res = await fetch(`/api/form-config/${modal.field.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to update field"); setSaving(false); return; }
        setFields((prev) => prev.map((f) => f.id === data.id ? data : f).sort((a, b) => a.sortOrder - b.sortOrder));
        closeModal();

      } else if (modal.mode === "editOptions" && modal.field) {
        const res = await fetch(`/api/form-config/${modal.field.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ options: fOptions }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to update options"); setSaving(false); return; }
        setFields((prev) => prev.map((f) => f.id === data.id ? data : f));
        closeModal();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(field: FormField) {
    try {
      const res = await fetch(`/api/form-config/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !field.isActive }),
      });
      const data = await res.json();
      if (res.ok) setFields((prev) => prev.map((f) => f.id === data.id ? data : f));
    } catch { /* silent */ }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/form-config/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setFields((prev) => prev.filter((f) => f.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  function addOption() {
    const val = fNewOption.trim();
    if (val && !fOptions.includes(val)) {
      setFOptions((prev) => [...prev, val]);
    }
    setFNewOption("");
  }

  function removeOption(opt: string) {
    setFOptions((prev) => prev.filter((o) => o !== opt));
  }

  const modalTitle =
    modal.mode === "create" ? "Add Custom Field" :
    modal.mode === "editOptions" ? `Edit Options — ${modal.field?.label}` :
    `Edit Field — ${modal.field?.label}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{fields.length} field(s) configured</p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} />
          Add Custom Field
        </Button>
      </div>

      {/* Fields table */}
      <div className="overflow-x-auto rounded-xl border border-[#e2e4f0]">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f5fb]">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e] w-12">Order</th>
              <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e]">Label</th>
              <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e] hidden md:table-cell">Field Key</th>
              <th className="text-left px-4 py-2.5 text-xs font-700 text-[#1a1f5e] hidden sm:table-cell">Type</th>
              <th className="text-center px-4 py-2.5 text-xs font-700 text-[#1a1f5e] hidden sm:table-cell">Req.</th>
              <th className="text-center px-4 py-2.5 text-xs font-700 text-[#1a1f5e]">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-700 text-[#1a1f5e]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e4f0]">
            {fields.map((field) => (
              <tr key={field.id} className={`hover:bg-[#f4f5fb]/50 transition-colors ${!field.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-2.5 text-gray-500 font-500">{field.sortOrder}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {field.isCore && (
                      <span title="Core field — cannot be deleted">
                        <Lock size={11} className="text-amber-500 flex-shrink-0" />
                      </span>
                    )}
                    <span className="font-600 text-[#1a1f5e]">{field.label}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs hidden md:table-cell">{field.fieldKey}</td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-600 bg-[#f4f5fb] text-[#3d2d8e] uppercase">
                    {field.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center hidden sm:table-cell">
                  {field.required ? (
                    <span className="text-[10px] font-700 text-green-600">Yes</span>
                  ) : (
                    <span className="text-[10px] text-gray-400">No</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {field.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-600 bg-green-50 text-green-700">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-600 bg-gray-100 text-gray-500">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    {/* Edit options for core dropdowns */}
                    {field.isCore && field.type === "dropdown" && (
                      <button
                        onClick={() => openEditOptions(field)}
                        className="px-2 py-1 rounded text-[10px] font-600 text-[#3d2d8e] bg-[#3d2d8e]/8 hover:bg-[#3d2d8e]/15 transition-colors"
                        title="Edit dropdown options"
                      >
                        Options
                      </button>
                    )}
                    {/* Edit */}
                    <button
                      onClick={() => openEdit(field)}
                      className="p-1.5 rounded-lg hover:bg-[#f4f5fb] text-gray-400 hover:text-[#1a1f5e] transition-colors"
                      title="Edit field"
                    >
                      <Pencil size={13} />
                    </button>
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(field)}
                      className="p-1.5 rounded-lg hover:bg-[#f4f5fb] text-gray-400 hover:text-[#1a1f5e] transition-colors"
                      title={field.isActive ? "Deactivate field" : "Activate field"}
                    >
                      {field.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    {/* Delete (custom only) */}
                    {!field.isCore && (
                      <button
                        onClick={() => setDeleteTarget(field)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete field"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      <Modal open={modal.open} onClose={closeModal} title={modalTitle} size="lg">
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {modal.mode === "editOptions" ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Manage the dropdown options for this field.</p>
              <div className="space-y-1.5">
                {fOptions.map((opt) => (
                  <div key={opt} className="flex items-center gap-2 group">
                    <span className="flex-1 text-sm text-[#1a1f5e] bg-[#f4f5fb] rounded-lg px-3 py-1.5">{opt}</span>
                    <button
                      onClick={() => removeOption(opt)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {fOptions.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No options yet. Add one below.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={fNewOption}
                  onChange={(e) => setFNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                  placeholder="Add option..."
                  className="flex-1 rounded-lg border border-[#e2e4f0] px-3 py-2 text-sm text-[#1a1f5e] focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]"
                />
                <Button size="sm" variant="outline" onClick={addOption} type="button">Add</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Label *"
                    value={fLabel}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="e.g. Number of FTEs"
                  />
                </div>
                <Input
                  label="Field Key *"
                  value={fKey}
                  onChange={(e) => setFKey(e.target.value)}
                  placeholder="e.g. numFtes"
                  hint="Unique identifier used internally"
                  disabled={modal.mode === "edit"}
                />
                {modal.mode === "create" ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-600 text-[#1a1f5e]">Type *</label>
                    <select
                      value={fType}
                      onChange={(e) => setFType(e.target.value as FieldType)}
                      className="w-full rounded-lg border border-[#e2e4f0] px-3 py-2 text-sm text-[#1a1f5e] focus:outline-none focus:ring-2 focus:ring-[#1a1f5e] appearance-none"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-600 text-[#1a1f5e]">Type</label>
                    <div className="rounded-lg border border-[#e2e4f0] px-3 py-2 text-sm text-gray-500 bg-[#f4f5fb] capitalize">
                      {modal.field?.type}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Placeholder"
                  value={fPlaceholder}
                  onChange={(e) => setFPlaceholder(e.target.value)}
                  placeholder="Shown inside the field"
                />
                <Input
                  label="Hint"
                  value={fHint}
                  onChange={(e) => setFHint(e.target.value)}
                  placeholder="Help text shown below the field"
                />
                <Input
                  label="Sort Order"
                  type="number"
                  value={String(fSortOrder)}
                  onChange={(e) => setFSortOrder(Number(e.target.value))}
                />
                <div className="flex flex-col gap-1 justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fRequired}
                      onChange={(e) => setFRequired(e.target.checked)}
                      className="accent-[#1a1f5e] w-4 h-4"
                    />
                    <span className="text-sm font-600 text-[#1a1f5e]">Required field</span>
                  </label>
                </div>
              </div>

              {/* Dropdown options editor */}
              {fType === "dropdown" && (
                <div className="space-y-2 p-3 rounded-xl bg-[#f4f5fb] border border-[#e2e4f0]">
                  <p className="text-xs font-600 text-[#1a1f5e]">Dropdown Options</p>
                  <div className="space-y-1">
                    {fOptions.map((opt) => (
                      <div key={opt} className="flex items-center gap-2 group">
                        <span className="flex-1 text-sm text-[#1a1f5e] bg-white rounded-lg px-3 py-1 border border-[#e2e4f0]">{opt}</span>
                        <button
                          type="button"
                          onClick={() => removeOption(opt)}
                          className="p-1 rounded text-gray-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={fNewOption}
                      onChange={(e) => setFNewOption(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                      placeholder="Add option..."
                      className="flex-1 rounded-lg border border-[#e2e4f0] px-3 py-1.5 text-sm text-[#1a1f5e] focus:outline-none focus:ring-2 focus:ring-[#1a1f5e] bg-white"
                    />
                    <Button size="sm" variant="outline" onClick={addOption} type="button">Add</Button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e4f0]">
            <Button variant="outline" size="sm" onClick={closeModal} type="button">Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSave} type="button">
              {modal.mode === "create" ? "Create Field" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Field"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong>{deleteTarget?.label}</strong>?
            This cannot be undone and will remove it from the intake form.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} type="button">
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={saving} onClick={handleDelete} type="button">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
