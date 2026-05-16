"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CostEstimator } from "./CostEstimator";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const schema = z.object({
  projectName: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().min(20, "Please provide a detailed description (at least 20 characters)"),
  scopeOfWork: z.enum(["SITE_SUPPORT_SERVICES", "SERVICE_DESK", "REMOTE_COMMAND_CENTER", "FIELD_SERVICES"]),
  location: z.string().min(2, "Please specify the location"),
  anticipatedStartDate: z.string().min(1, "Start date is required"),
  anticipatedEndDate: z.string().min(1, "End date is required"),
  budgetAvailable: z.union([z.boolean(), z.string()]).transform(v => v === true || v === "true"),
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

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { budgetAvailable: true },
  });

  const scopeOfWork = watch("scopeOfWork");
  const startDate = watch("anticipatedStartDate");
  const endDate = watch("anticipatedEndDate");

  async function onSubmit(data: FormData) {
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

        <div className="md:col-span-2">
          <Textarea
            label="Project Description *"
            placeholder="Provide a detailed description of the project requirements..."
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />
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
      </div>

      {/* Live cost estimate */}
      {scopeOfWork && startDate && endDate && (
        <CostEstimator scopeOfWork={scopeOfWork} startDate={startDate} endDate={endDate} />
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
