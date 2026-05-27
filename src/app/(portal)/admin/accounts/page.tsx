import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { format } from "date-fns";
import { SCOPE_LABELS } from "@/types/enums";

export default async function ClientAccountsPage() {
  await requireAuth(["PMO_LEAD", "SUPER_ADMIN"]);

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      submittedProjects: {
        select: {
          id: true,
          projectName: true,
          status: true,
          ragStatus: true,
          estimatedCost: true,
          poValue: true,
          invoicedAmount: true,
          createdAt: true,
          region: true,
          scopeOfWork: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const ACTIVE_STATUSES = [
    "SUBMITTED","UNDER_REVIEW","INFO_REQUIRED","SOLUTIONING","SOW_DRAFT",
    "SOW_APPROVAL","SOW_SIGNED","PO_REQUESTED","PO_RECEIVED","RESOURCE_ASSIGNED","HANDED_TO_OPERATIONS",
  ];
  const CLOSED_STATUSES = ["CLOSED_SUCCESS", "CLOSED_REJECTED", "CANCELLED"];

  const totalClients = clients.length;
  const totalActiveEngagements = clients.reduce(
    (sum, c) => sum + c.submittedProjects.filter((p) => ACTIVE_STATUSES.includes(p.status)).length,
    0
  );
  const totalPipelineValue = clients.reduce(
    (sum, c) =>
      sum +
      c.submittedProjects.reduce((ps, p) => ps + (p.poValue ?? p.estimatedCost ?? 0), 0),
    0
  );

  const RAG_COLORS: Record<string, string> = {
    GREEN: "bg-green-100 text-green-700",
    AMBER: "bg-amber-100 text-amber-700",
    RED: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/admin"
          className="mt-1 p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-800 text-[#1a1f5e]">Client Accounts</h1>
          <p className="text-sm text-gray-500">Overview of all client accounts and their engagements</p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500">Total Clients</p>
          <p className="text-2xl font-800 text-[#1a1f5e] mt-1">{totalClients}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Active Engagements</p>
          <p className="text-2xl font-800 text-[#1a1f5e] mt-1">{totalActiveEngagements}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Total Pipeline Value</p>
          <p className="text-2xl font-800 text-[#16a34a] mt-1">${totalPipelineValue.toLocaleString()}</p>
        </Card>
      </div>

      {/* Client cards */}
      {clients.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-400 py-4 text-center">No client accounts found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {clients.map((client) => {
            const projects = client.submittedProjects;
            const active = projects.filter((p) => ACTIVE_STATUSES.includes(p.status));
            const closed = projects.filter((p) => CLOSED_STATUSES.includes(p.status));
            const totalPO = projects.reduce((s, p) => s + (p.poValue ?? 0), 0);
            const totalInvoiced = projects.reduce((s, p) => s + (p.invoicedAmount ?? 0), 0);

            return (
              <Card key={client.id}>
                {/* Client header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1f5e]/10 flex items-center justify-center text-[#1a1f5e] font-700 text-base flex-shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-700 text-[#1a1f5e]">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-right">
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">Projects</p>
                      <p className="text-sm font-700 text-[#1a1f5e]">{projects.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">Active / Closed</p>
                      <p className="text-sm font-700 text-[#1a1f5e]">{active.length} / {closed.length}</p>
                    </div>
                    {totalPO > 0 && (
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400">Total PO Value</p>
                        <p className="text-sm font-700 text-[#16a34a]">${totalPO.toLocaleString()}</p>
                      </div>
                    )}
                    {totalInvoiced > 0 && (
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400">Invoiced</p>
                        <p className="text-sm font-700 text-blue-700">${totalInvoiced.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project list */}
                {projects.length > 0 && (
                  <div className="space-y-2 border-t border-[#e2e4f0] pt-3">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-[#e2e4f0] hover:bg-[#f4f5fb] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/projects/${proj.id}`}
                              className="text-sm font-600 text-[#1a1f5e] hover:underline truncate"
                            >
                              {proj.projectName}
                            </Link>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-600 ${RAG_COLORS[proj.ragStatus] ?? "bg-gray-100 text-gray-500"}`}>
                              {proj.ragStatus}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-xs text-gray-400">
                              {SCOPE_LABELS[proj.scopeOfWork as keyof typeof SCOPE_LABELS] ?? proj.scopeOfWork}
                            </p>
                            <p className="text-xs text-gray-400">· {proj.region}</p>
                            <p className="text-xs text-gray-400">
                              · {format(new Date(proj.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {(proj.poValue ?? 0) > 0 && (
                            <p className="text-xs font-600 text-[#1a1f5e]">${(proj.poValue ?? 0).toLocaleString()}</p>
                          )}
                          <StatusBadge status={proj.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
