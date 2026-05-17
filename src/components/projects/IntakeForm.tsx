"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CostEstimator } from "./CostEstimator";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

interface CustomFormField {
  id: string;
  fieldKey: string;
  label: string;
  type: string;
  required: boolean;
  options: string | null;
  placeholder: string | null;
  hint: string | null;
  isCore: boolean;
  isActive: boolean;
}

const schema = z.object({
  projectName: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().min(20, "Please provide a detailed description (at least 20 characters)"),
  scopeOfWork: z.enum(["SITE_SUPPORT_SERVICES", "SERVICE_DESK", "REMOTE_COMMAND_CENTER", "FIELD_SERVICES"]),
  location: z.string().min(2, "Please specify the location"),
  region: z.enum(["NA", "EMEA", "LATAM", "ASPAC"]),
  anticipatedStartDate: z.string().min(1, "Start date is required"),
  anticipatedEndDate: z.string().min(1, "End date is required"),
  budgetAvailable: z.any().transform((v): boolean => v === true || v === "true"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SCOPE_OPTIONS = [
  { value: "SITE_SUPPORT_SERVICES", label: "Site Support Services" },
  { value: "SERVICE_DESK", label: "Service Desk" },
  { value: "REMOTE_COMMAND_CENTER", label: "Remote Command Center" },
  { value: "FIELD_SERVICES", label: "Field Services" },
];

export function IntakeForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const [customFields, setCustomFields] = useState<CustomFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    fetch("/api/form-config")
      .then((r) => r.json())
      .then((data: CustomFormField[]) => {
        const nonCore = data.filter((f) => !f.isCore && f.isActive);
        setCustomFields(nonCore);
      })
      .catch(() => { /* non-critical */ });
  }, []);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { budgetAvailable: true, region: "NA" },
  });

  const scopeOfWork    = watch("scopeOfWork");
  const startDate      = watch("anticipatedStartDate");
  const endDate        = watch("anticipatedEndDate");
  const region         = watch("region");
  const description    = watch("description");
  const projectName    = watch("projectName");

  async function enhanceDescription() {
    if (!description || description.trim().length < 10) return;
    setEnhancing(true);
    setEnhanceError("");
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, projectName, scopeOfWork }),
      });
      const data = await res.json();
      if (!res.ok || !data.enhanced) {
        setEnhanceError(data.error ?? "AI enhancement failed");
        return;
      }
      setValue("description", data.enhanced, { shouldValidate: true });
    } catch {
      setEnhanceError("Failed to connect to AI service");
    } finally {
      setEnhancing(false);
    }
  }

  async function onSubmit(data: FormData) {
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          customFields: Object.keys(customFieldValues).length > 0
            ? JSON.stringify(customFieldValues)
            : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to submit request");
        return;
      }
      const project = await res.json();
      setSuccess(true);
      setTimeout(() => router.push(`/projects/${project.id}`), 1500);
    } catch {
      setError("An unexpected error occurred");
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <CheckCircle2 size={48} className="text-green-500" />
        <h2 className="text-xl font-700 text-[#1a1f5e]">Request Submitted!</h2>
        <p className="text-sm text-gray-500">Redirecting to your project...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Project Name *"
            placeholder="e.g. Dallas HQ Service Desk Upgrade"
            error={errors.projectName?.message}
            {...register("projectName")}
          />
        </div>

        {/* Description with AI Enhance button */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-600 text-[#1a1f5e]">Project Description *</label>
            <button
              type="button"
              onClick={enhanceDescription}
              disabled={!description || description.trim().length < 10 || enhancing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-600 text-[#3d2d8e] bg-[#3d2d8e]/8 hover:bg-[#3d2d8e]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Use AI to make your description more professional and complete"
            >
              <Sparkles size={11} className={enhancing ? "animate-spin" : ""} />
              {enhancing ? "Enhancing..." : "✨ Enhance with AI"}
            </button>
          </div>
          <Textarea
            placeholder="Provide a detailed description of the project requirements..."
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />
          {enhanceError && (
            <p className="text-xs text-amber-600 mt-1">{enhanceError}</p>
          )}
          {!enhanceError && (
            <p className="text-[10px] text-gray-400 mt-1">
              Tip: click ✨ Enhance to let AI expand and professionalise your description
            </p>
          )}
        </div>

        <Select
          label="Scope of Work *"
          options={SCOPE_OPTIONS}
          placeholder="Select scope..."
          error={errors.scopeOfWork?.message}
          {...register("scopeOfWork")}
        />

        <Input
          label="Location *"
          placeholder="e.g. Dallas, TX"
          error={errors.location?.message}
          {...register("location")}
        />

        <Select
          label="Region *"
          options={[
            { value: "NA", label: "North America" },
            { value: "EMEA", label: "Europe, Middle East & Africa" },
            { value: "LATAM", label: "Latin America" },
            { value: "ASPAC", label: "Asia Pacific" },
          ]}
          error={errors.region?.message}
          {...register("region")}
        />

        <Input
          label="Anticipated Start Date *"
          type="date"
          error={errors.anticipatedStartDate?.message}
          {...register("anticipatedStartDate")}
        />

        <Input
          label="Anticipated End Date *"
          type="date"
          error={errors.anticipatedEndDate?.message}
          {...register("anticipatedEndDate")}
        />

        <div className="md:col-span-2">
          <label className="text-sm font-600 text-[#1a1f5e] block mb-1">Budget Available *</label>
          <div className="flex gap-4">
            {[{ value: true, label: "Yes, budget is available" }, { value: false, label: "No / TBD" }].map(({ value, label }) => (
              <label key={String(value)} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={String(value)}
                  {...register("budgetAvailable", { setValueAs: (v) => v === "true" })}
                  className="accent-[#1a1f5e]"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Additional Notes"
            placeholder="Any other relevant details, special requirements, or context..."
            rows={2}
            {...register("notes")}
          />
        </div>

        {/* Dynamic custom fields */}
        {customFields.map((field) => {
          const value = customFieldValues[field.fieldKey];
          const strValue = value !== undefined && value !== null ? String(value) : "";
          const parseOpts = (raw: string | null): string[] => {
            if (!raw) return [];
            try { return JSON.parse(raw); } catch { return []; }
          };

          if (field.type === "checkbox") {
            return (
              <div key={field.fieldKey} className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) =>
                      setCustomFieldValues((prev) => ({ ...prev, [field.fieldKey]: e.target.checked }))
                    }
                    className="accent-[#1a1f5e] w-4 h-4"
                  />
                  <span className="text-sm font-600 text-[#1a1f5e]">
                    {field.label}{field.required && " *"}
                  </span>
                </label>
                {field.hint && <p className="text-xs text-gray-500 mt-0.5 ml-6">{field.hint}</p>}
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <div key={field.fieldKey} className="md:col-span-2">
                <Textarea
                  label={`${field.label}${field.required ? " *" : ""}`}
                  placeholder={field.placeholder ?? undefined}
                  hint={field.hint ?? undefined}
                  value={strValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCustomFieldValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            );
          }

          if (field.type === "dropdown") {
            const opts = parseOpts(field.options);
            return (
              <div key={field.fieldKey}>
                <Select
                  label={`${field.label}${field.required ? " *" : ""}`}
                  placeholder={field.placeholder ?? "Select..."}
                  hint={field.hint ?? undefined}
                  options={opts.map((o) => ({ value: o, label: o }))}
                  value={strValue}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCustomFieldValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))
                  }
                />
              </div>
            );
          }

          // text | number | date
          return (
            <div key={field.fieldKey}>
              <Input
                label={`${field.label}${field.required ? " *" : ""}`}
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                placeholder={field.placeholder ?? undefined}
                hint={field.hint ?? undefined}
                value={strValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomFieldValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))
                }
              />
            </div>
          );
        })}
      </div>

      {/* Live cost estimate */}
      {scopeOfWork && startDate && endDate && (
        <CostEstimator scopeOfWork={scopeOfWork} startDate={startDate} endDate={endDate} region={region} />
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} size="lg">
          Submit Request
        </Button>
      </div>
    </form>
  );
}
