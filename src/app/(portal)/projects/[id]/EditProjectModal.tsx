"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Edit2 } from "lucide-react";
import { PRIORITY_LABELS, URGENCY_LABELS, COVERAGE_MODEL_LABELS, WORKPLACE_MODEL_LABELS } from "@/types/enums";

type EditableFields = {
  projectName?: string;
  description?: string;
  location?: string;
  anticipatedStartDate?: string;
  anticipatedEndDate?: string;
  ragStatus?: string;
  notes?: string;
  closureNotes?: string;
  priority?: string;
  urgency?: string;
  numberOfFtes?: number | string;
  coverageModel?: string;
  workplaceModel?: string;
};

type Project = {
  id: string;
  projectName: string;
  description: string;
  location: string;
  anticipatedStartDate: string;
  anticipatedEndDate: string;
  ragStatus: string;
  notes?: string | null;
  closureNotes?: string | null;
  priority?: string;
  urgency?: string;
  numberOfFtes?: number | null;
  coverageModel?: string | null;
  workplaceModel?: string | null;
};

const RAG_OPTIONS = [
  { value: "GREEN", label: "Green — On Track" },
  { value: "AMBER", label: "Amber — At Risk" },
  { value: "RED", label: "Red — Blocked" },
];

function toDateInput(val: string | Date | undefined | null): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function EditProjectModal({
  project,
  userRole,
}: {
  project: Project;
  userRole: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const canEdit = userRole === "SUPER_ADMIN" || userRole === "PMO_LEAD";

  const [fields, setFields] = useState<EditableFields>({
    projectName: project.projectName,
    description: project.description,
    location: project.location,
    anticipatedStartDate: toDateInput(project.anticipatedStartDate),
    anticipatedEndDate: toDateInput(project.anticipatedEndDate),
    ragStatus: project.ragStatus,
    notes: project.notes ?? "",
    closureNotes: project.closureNotes ?? "",
    priority: project.priority ?? "MEDIUM",
    urgency: project.urgency ?? "STANDARD",
    numberOfFtes: project.numberOfFtes ?? 1,
    coverageModel: project.coverageModel ?? "STANDARD_8X5",
    workplaceModel: project.workplaceModel ?? "ON_SITE",
  });

  if (!canEdit) return null;

  function update(key: keyof EditableFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        ragStatus: fields.ragStatus,
        notes: fields.notes,
        closureNotes: fields.closureNotes,
        anticipatedStartDate: fields.anticipatedStartDate,
        anticipatedEndDate: fields.anticipatedEndDate,
        priority: fields.priority,
        urgency: fields.urgency,
        numberOfFtes: fields.numberOfFtes ? parseInt(String(fields.numberOfFtes)) : undefined,
        coverageModel: fields.coverageModel,
        workplaceModel: fields.workplaceModel,
      };
      if (isSuperAdmin) {
        body.projectName = fields.projectName;
        body.description = fields.description;
        body.location = fields.location;
      }

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to update project");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Edit2 size={13} />
        {isSuperAdmin ? "Edit Project (Admin)" : "Edit Project"}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={isSuperAdmin ? "Edit Project — Admin Override" : "Edit Project"}>
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {isSuperAdmin && (
            <>
              <Input
                label="Project Name"
                value={fields.projectName ?? ""}
                onChange={(e) => update("projectName", e.target.value)}
              />
              <Textarea
                label="Description"
                value={fields.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
              />
              <Input
                label="Location"
                value={fields.location ?? ""}
                onChange={(e) => update("location", e.target.value)}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={fields.anticipatedStartDate ?? ""}
              onChange={(e) => update("anticipatedStartDate", e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={fields.anticipatedEndDate ?? ""}
              onChange={(e) => update("anticipatedEndDate", e.target.value)}
            />
          </div>

          <Select
            label="RAG Status"
            options={RAG_OPTIONS}
            value={fields.ragStatus ?? "GREEN"}
            onChange={(e) => update("ragStatus", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
              value={fields.priority ?? "MEDIUM"}
              onChange={(e) => update("priority", e.target.value)}
            />
            <Select
              label="Urgency"
              options={Object.entries(URGENCY_LABELS).map(([value, label]) => ({ value, label }))}
              value={fields.urgency ?? "STANDARD"}
              onChange={(e) => update("urgency", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="FTEs"
              type="number"
              value={String(fields.numberOfFtes ?? 1)}
              onChange={(e) => update("numberOfFtes", e.target.value)}
            />
            <Select
              label="Coverage Model"
              options={Object.entries(COVERAGE_MODEL_LABELS).map(([value, label]) => ({ value, label }))}
              value={fields.coverageModel ?? "STANDARD_8X5"}
              onChange={(e) => update("coverageModel", e.target.value)}
            />
            <Select
              label="Workplace Model"
              options={Object.entries(WORKPLACE_MODEL_LABELS).map(([value, label]) => ({ value, label }))}
              value={fields.workplaceModel ?? "ON_SITE"}
              onChange={(e) => update("workplaceModel", e.target.value)}
            />
          </div>

          <Textarea
            label="Notes"
            value={fields.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
          />

          <Textarea
            label="Closure Notes"
            value={fields.closureNotes ?? ""}
            onChange={(e) => update("closureNotes", e.target.value)}
            rows={2}
            placeholder="Add notes when closing the project..."
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={loading} onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
