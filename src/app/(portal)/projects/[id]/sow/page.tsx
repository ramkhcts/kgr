import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SOWPanel } from "./SOWPanel";
import { Card } from "@/components/ui/Card";
import { format } from "date-fns";
import { SCOPE_LABELS } from "@/types/enums";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default async function SOWPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(["PMO_LEAD", "PMO_TEAM", "CLIENT", "SUPER_ADMIN"]);
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { name: true, email: true } },
      assignedResource: { select: { name: true } },
      documents: {
        where: { type: "SOW_DRAFT" },
        select: { id: true, name: true, type: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) notFound();

  // Clients only see their own
  if (user.role === "CLIENT" && project.submittedById !== user.id) notFound();

  const rateCardEntries = await prisma.rateCard.findMany({
    where: { serviceType: project.scopeOfWork, isActive: true },
    orderBy: { hourlyRate: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`} className="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-800 text-[#1a1f5e]">Statement of Work</h1>
          <p className="text-sm text-gray-500">{project.projectName}</p>
        </div>
      </div>

      {/* SOW Preview */}
      <Card>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e2e4f0]">
          <FileText size={18} className="text-[#1a1f5e]" />
          <p className="text-sm font-700 text-[#1a1f5e]">SOW Preview</p>
        </div>
        <div className="space-y-4 text-sm">
          <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, #1a1f5e, #3d2d8e)" }}>
            <p className="text-[#d4a017] font-800 text-base">KGR End User Services</p>
            <p className="text-white/70 text-xs">Statement of Work · Customer: KarthikLLC</p>
            {project.msaReference && (
              <p className="text-white/60 text-xs mt-1">Governing Agreement: {project.msaReference}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Project", value: project.projectName },
              { label: "Scope", value: SCOPE_LABELS[project.scopeOfWork as keyof typeof SCOPE_LABELS] },
              { label: "Location", value: project.location },
              { label: "Requestor", value: project.submittedBy.name },
              { label: "Start Date", value: format(new Date(project.anticipatedStartDate), "MMMM d, yyyy") },
              { label: "End Date", value: format(new Date(project.anticipatedEndDate), "MMMM d, yyyy") },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-lg bg-[#f4f5fb]">
                <p className="text-[10px] font-700 text-[#1a1f5e] uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-2">Description</p>
            <p className="text-gray-700 text-sm">{project.description}</p>
          </div>

          <div>
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-2">Rate Card</p>
            <table className="w-full text-xs border border-[#e2e4f0] rounded-lg overflow-hidden">
              <thead className="bg-[#1a1f5e] text-[#d4a017]">
                <tr>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-right px-3 py-2">Hourly (USD)</th>
                  <th className="text-right px-3 py-2">Daily (USD)</th>
                </tr>
              </thead>
              <tbody>
                {rateCardEntries.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f4f5fb]"}>
                    <td className="px-3 py-2">{r.roleName}</td>
                    <td className="px-3 py-2 text-right">${r.hourlyRate.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">${r.dailyRate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {project.estimatedCost && (
            <p className="text-sm font-700 text-[#16a34a]">
              Estimated Project Cost: ${project.estimatedCost.toLocaleString()} USD
            </p>
          )}
        </div>
      </Card>

      <SOWPanel
        project={{
          id: project.id,
          status: project.status,
          documents: project.documents,
          msaReference: project.msaReference,
          poValue: project.poValue,
          poCurrency: project.poCurrency,
          paymentTermsDays: project.paymentTermsDays,
        }}
        userRole={user.role}
      />
    </div>
  );
}
