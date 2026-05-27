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
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  URGENCY_LABELS,
  COVERAGE_MODEL_LABELS,
  WORKPLACE_MODEL_LABELS,
  CONTRACT_TYPE_LABELS,
  DATA_CLASSIFICATION_LABELS,
  ITSM_PLATFORM_LABELS,
} from "@/types/enums";

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
  goLiveDeadline: z.string().optional(),
  budgetAvailable: z.any().transform((v): boolean => v === true || v === "true"),
  budgetRangeMin: z.number().optional(),
  budgetRangeMax: z.number().optional(),
  notes: z.string().optional(),
  priority:             z.enum(["CRITICAL","HIGH","MEDIUM","LOW"]),
  urgency:              z.enum(["EMERGENCY","URGENT","STANDARD","PLANNED"]),
  requestingDepartment: z.string().min(1, "Department is required"),
  businessOwner:        z.string().min(1, "Business owner is required"),
  businessOwnerEmail:   z.string().email("Invalid email").optional().or(z.literal("")),
  businessJustification:z.string().min(20, "Please provide a business justification (at least 20 characters)"),
  contractType:         z.enum(["NOT_SURE","TIME_AND_MATERIALS","FIXED_PRICE","MANAGED_SERVICE"]).optional(),
  dataClassification:   z.enum(["PUBLIC","INTERNAL","CONFIDENTIAL","RESTRICTED"]).optional(),
  numberOfFtes:         z.number().int().min(1, "At least 1 FTE required"),
  coverageModel:        z.enum(["STANDARD_8X5","EXTENDED_12X5","HOURS_24X7","FOLLOW_THE_SUN"]),
  workplaceModel:       z.enum(["ON_SITE","ONSHORE_REMOTE","OFFSHORE_REMOTE","HYBRID_ON_SITE_ONSHORE","HYBRID_ON_SITE_OFFSHORE","HYBRID_ONSHORE_OFFSHORE","HYBRID_ALL"]),
  incumbentVendor:      z.string().optional(),
  complianceNotes:      z.string().optional(),
  requiredLanguages:    z.string().optional(),
  estimatedMonthlyTickets: z.number().int().optional(),
  avgHandleTimeMinutes:    z.number().int().optional(),
  itsmPlatform:            z.enum(["SERVICENOW","JIRA_SERVICE_MANAGEMENT","REMEDY","ZENDESK","FRESHSERVICE","OTHER","NONE"]).optional(),
  estimatedAssetCount:     z.number().int().optional(),
}).refine(data => !data.anticipatedEndDate || !data.anticipatedStartDate || new Date(data.anticipatedEndDate) > new Date(data.anticipatedStartDate), {
  message: "End date must be after start date",
  path: ["anticipatedEndDate"],
});

type FormData = z.infer<typeof schema>;

const SCOPE_OPTIONS = [
  { value: "SITE_SUPPORT_SERVICES", label: "Site Support Services" },
  { value: "SERVICE_DESK", label: "Service Desk" },
  { value: "REMOTE_COMMAND_CENTER", label: "Remote Command Center" },
  { value: "FIELD_SERVICES", label: "Field Services" },
];

const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
const URGENCY_OPTIONS = Object.entries(URGENCY_LABELS).map(([value, label]) => ({ value, label }));
const COVERAGE_OPTIONS = Object.entries(COVERAGE_MODEL_LABELS).map(([value, label]) => ({ value, label }));
const WORKPLACE_OPTIONS = Object.entries(WORKPLACE_MODEL_LABELS).map(([value, label]) => ({ value, label }));
const CONTRACT_TYPE_OPTIONS = Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const DATA_CLASSIFICATION_OPTIONS = Object.entries(DATA_CLASSIFICATION_LABELS).map(([value, label]) => ({ value, label }));
const ITSM_PLATFORM_OPTIONS = Object.entries(ITSM_PLATFORM_LABELS).map(([value, label]) => ({ value, label }));

export function IntakeForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const [customFields, setCustomFields] = useState<CustomFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | boolean>>({});
  const [similarProjects, setSimilarProjects] = useState<{id:string;projectName:string;status:string;location:string}[]>([]);

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
    defaultValues: {
      budgetAvailable: true,
      region: "NA",
      priority: "MEDIUM",
      urgency: "STANDARD",
      numberOfFtes: 1,
      coverageModel: "STANDARD_8X5",
      workplaceModel: "ON_SITE",
    },
  });

  const scopeOfWork    = watch("scopeOfWork");
  const startDate      = watch("anticipatedStartDate");
  const endDate        = watch("anticipatedEndDate");
  const region         = watch("region");
  const description    = watch("description");
  const projectName    = watch("projectName");
  const watchedPriority = watch("priority") ?? "MEDIUM";
  const watchedLocation = watch("location");
  const watchedRegion   = watch("region");
  const watchedScope    = watch("scopeOfWork");
  const watchedBudget   = watch("budgetAvailable");
  const isServiceDeskOrRCC = watchedScope === "SERVICE_DESK" || watchedScope === "REMOTE_COMMAND_CENTER";
  const isFieldOrSite      = watchedScope === "FIELD_SERVICES" || watchedScope === "SITE_SUPPORT_SERVICES";
  const startDatePast = startDate ? new Date(startDate) < new Date(new Date().toISOString().split("T")[0]) : false;

  // Duplicate detection with 500ms debounce
  useEffect(() => {
    if (!watchedScope || !watchedLocation || !watchedRegion) {
      setSimilarProjects([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/projects/similar?scopeOfWork=${watchedScope}&location=${encodeURIComponent(watchedLocation)}&region=${watchedRegion}`
        );
        if (res.ok) {
          const data = await res.json();
          setSimilarProjects(data);
        }
      } catch {
        // non-critical
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [watchedScope, watchedLocation, watchedRegion]);

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
          contractType: data.contractType || undefined,
          dataClassification: data.dataClassification || undefined,
          itsmPlatform: data.itsmPlatform || undefined,
          goLiveDeadline: data.goLiveDeadline || undefined,
          businessOwnerEmail: data.businessOwnerEmail || undefined,
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

        {/* Business Context section */}
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide col-span-2 mt-2">Business Context</p>

        <Input
          label="Requesting Department *"
          placeholder="e.g. IT Operations, Finance, HR"
          error={errors.requestingDepartment?.message}
          {...register("requestingDepartment")}
        />

        <Input
          label="Business Owner / Sponsor *"
          placeholder="Full name and title"
          error={errors.businessOwner?.message}
          {...register("businessOwner")}
        />

        <Input
          label="Business Owner Email"
          type="email"
          placeholder="owner@company.com"
          error={errors.businessOwnerEmail?.message}
          {...register("businessOwnerEmail")}
        />

        <div className="md:col-span-2">
          <Textarea
            label="Business Justification *"
            placeholder="Why is this engagement needed? What business outcome does it support?"
            rows={2}
            error={errors.businessJustification?.message}
            {...register("businessJustification")}
          />
        </div>

        <Select
          label="Contract Type"
          options={CONTRACT_TYPE_OPTIONS}
          placeholder="Select contract type..."
          error={errors.contractType?.message}
          {...register("contractType")}
        />

        <Select
          label="Data Classification"
          options={DATA_CLASSIFICATION_OPTIONS}
          placeholder="Select classification..."
          error={errors.dataClassification?.message}
          {...register("dataClassification")}
        />

        {/* Priority + Urgency row */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-600 text-[#1a1f5e]">Priority</label>
            <span
              style={{
                backgroundColor: (PRIORITY_COLORS[watchedPriority] ?? "#2563eb") + "18",
                color: PRIORITY_COLORS[watchedPriority] ?? "#2563eb",
              }}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-600"
            >
              {PRIORITY_LABELS[watchedPriority] ?? watchedPriority}
            </span>
          </div>
          <Select
            options={PRIORITY_OPTIONS}
            error={errors.priority?.message}
            {...register("priority")}
          />
        </div>

        <Select
          label="Urgency"
          options={URGENCY_OPTIONS}
          error={errors.urgency?.message}
          {...register("urgency")}
        />

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

        {/* Duplicate detection warning */}
        {similarProjects.length > 0 && (
          <div className="md:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-700 text-amber-700 mb-1">⚠ Similar active project(s) found</p>
            {similarProjects.map(p => (
              <a key={p.id} href={`/projects/${p.id}`} target="_blank" rel="noopener noreferrer"
                className="block text-xs text-amber-600 hover:underline">
                {p.projectName} — {p.location} ({p.status.replace(/_/g, " ")})
              </a>
            ))}
            <p className="text-[10px] text-amber-500 mt-1">You can still submit — this is for your information only.</p>
          </div>
        )}

        {/* Delivery Model section */}
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide col-span-2 mt-2">Delivery Model</p>

        <Input
          label="Number of FTEs *"
          type="number"
          placeholder="e.g. 3"
          min={1}
          max={500}
          error={errors.numberOfFtes?.message}
          {...register("numberOfFtes", { valueAsNumber: true, min: { value: 1, message: "At least 1 FTE required" } })}
        />

        <Select
          label="Coverage Model *"
          options={COVERAGE_OPTIONS}
          error={errors.coverageModel?.message}
          {...register("coverageModel")}
        />

        <Select
          label="Workplace Model *"
          options={WORKPLACE_OPTIONS}
          error={errors.workplaceModel?.message}
          {...register("workplaceModel")}
        />

        <Input
          label="Incumbent Vendor"
          placeholder="Leave blank if new deployment"
          {...register("incumbentVendor")}
        />

        <div className="md:col-span-2">
          <Textarea
            label="Compliance Requirements"
            placeholder="e.g. HIPAA, SOX, PCI-DSS, None"
            rows={2}
            {...register("complianceNotes")}
          />
        </div>

        <Input
          label="Required Languages"
          placeholder="e.g. English, Spanish, German"
          {...register("requiredLanguages")}
        />

        {isServiceDeskOrRCC && (
          <>
            <Input
              label="Est. Monthly Ticket Volume"
              type="number"
              placeholder="e.g. 500"
              min={0}
              error={errors.estimatedMonthlyTickets?.message}
              {...register("estimatedMonthlyTickets", { valueAsNumber: true })}
            />
            <Input
              label="Avg Handle Time (min)"
              type="number"
              placeholder="e.g. 15"
              min={0}
              error={errors.avgHandleTimeMinutes?.message}
              {...register("avgHandleTimeMinutes", { valueAsNumber: true })}
            />
            <Select
              label="ITSM Platform"
              options={ITSM_PLATFORM_OPTIONS}
              placeholder="Select ITSM platform..."
              error={errors.itsmPlatform?.message}
              {...register("itsmPlatform")}
            />
          </>
        )}

        {isFieldOrSite && (
          <Input
            label="Est. Asset / Device Count"
            type="number"
            placeholder="e.g. 200"
            min={0}
            error={errors.estimatedAssetCount?.message}
            {...register("estimatedAssetCount", { valueAsNumber: true })}
          />
        )}

        <Input
          label="Anticipated Start Date *"
          type="date"
          error={errors.anticipatedStartDate?.message}
          {...register("anticipatedStartDate")}
        />
        {startDatePast && (
          <p className="text-xs text-amber-600 -mt-3 col-span-1">Start date is in the past</p>
        )}

        <Input
          label="Anticipated End Date *"
          type="date"
          error={errors.anticipatedEndDate?.message}
          {...register("anticipatedEndDate")}
        />

        <Input
          label="Go-Live Deadline (if different from start date)"
          type="date"
          {...register("goLiveDeadline")}
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

        {watchedBudget && (
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <Input
              label="Budget Min (USD)"
              type="number"
              placeholder="e.g. 50000"
              min={0}
              error={errors.budgetRangeMin?.message}
              {...register("budgetRangeMin", { valueAsNumber: true })}
            />
            <Input
              label="Budget Max (USD)"
              type="number"
              placeholder="e.g. 200000"
              min={0}
              error={errors.budgetRangeMax?.message}
              {...register("budgetRangeMax", { valueAsNumber: true })}
            />
          </div>
        )}

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
        <CostEstimator scopeOfWork={scopeOfWork} startDate={startDate} endDate={endDate} region={region} numberOfFtes={watch("numberOfFtes")} />
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
