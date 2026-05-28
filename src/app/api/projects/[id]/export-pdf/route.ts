import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RAG_COLORS: Record<string, string> = {
  GREEN: "#16a34a",
  AMBER: "#d97706",
  RED: "#dc2626",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  INFO_REQUIRED: "Info Required",
  SOLUTIONING: "Solutioning",
  SOW_DRAFT: "SOW Draft",
  SOW_APPROVAL: "SOW Approval",
  SOW_SIGNED: "SOW Signed",
  PO_REQUESTED: "PO Requested",
  PO_RECEIVED: "PO Received",
  RESOURCE_ASSIGNED: "Resource Assigned",
  HANDED_TO_OPERATIONS: "Handed to Operations",
  CLOSED_SUCCESS: "Closed — Success",
  CLOSED_REJECTED: "Closed — Rejected",
  CANCELLED: "Cancelled",
};

const SCOPE_LABELS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};

function fmt(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function row(label: string, value: string | undefined | null): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:13px;width:160px;vertical-align:top">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#1a1f5e;font-weight:500">${value}</td>
  </tr>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { name: true, email: true } },
      assignedResource: { select: { name: true } },
      statusHistory: {
        include: { changedBy: { select: { name: true, role: true } } },
        orderBy: { changedAt: "asc" },
      },
      resources: {
        include: { user: { select: { name: true } } },
      },
      invoiceMilestones: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const p = project as typeof project & {
    priority?: string | null;
    urgency?: string | null;
    numberOfFtes?: number | null;
    coverageModel?: string | null;
    workplaceModel?: string | null;
    requestingDepartment?: string | null;
    businessOwner?: string | null;
    poValue?: number | null;
    poCurrency?: string | null;
    estimatedCost?: number | null;
    invoicedAmount?: number | null;
    paymentTermsDays?: number | null;
    contractType?: string | null;
    serviceTier?: string | null;
    region?: string;
  };

  const ragColor = RAG_COLORS[project.ragStatus] ?? "#16a34a";
  const statusLabel = STATUS_LABELS[project.status] ?? project.status;

  const resourcesHtml = p.resources.length > 0 ? `
    <h2 style="color:#1a1f5e;font-size:15px;font-weight:700;margin:24px 0 12px;border-bottom:2px solid #e2e4f0;padding-bottom:8px">Resources</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f4f5fb">
          <th style="text-align:left;padding:8px 12px;color:#1a1f5e;font-weight:700;font-size:11px;text-transform:uppercase">Role</th>
          <th style="text-align:left;padding:8px 12px;color:#1a1f5e;font-weight:700;font-size:11px;text-transform:uppercase">Name</th>
          <th style="text-align:right;padding:8px 12px;color:#1a1f5e;font-weight:700;font-size:11px;text-transform:uppercase">Daily Rate</th>
          <th style="text-align:left;padding:8px 12px;color:#1a1f5e;font-weight:700;font-size:11px;text-transform:uppercase">Period</th>
        </tr>
      </thead>
      <tbody>
        ${p.resources.map((r, i) => `
          <tr style="background:${i % 2 === 0 ? "white" : "#fafafa"};border-top:1px solid #e2e4f0">
            <td style="padding:8px 12px;font-weight:600;color:#1a1f5e">${r.roleName}${r.isLead ? " ★" : ""}</td>
            <td style="padding:8px 12px;color:#374151">${(r as typeof r & { externalResourceName?: string | null }).externalResourceName ?? r.user?.name ?? "External"}</td>
            <td style="padding:8px 12px;text-align:right;color:#374151">${r.currency} ${r.dailyRate.toLocaleString()}/day</td>
            <td style="padding:8px 12px;color:#6b7280;font-size:12px">${fmt(r.startDate)} – ${fmt(r.endDate)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  const invoicesHtml = project.invoiceMilestones.length > 0 ? `
    <h2 style="color:#1a1f5e;font-size:15px;font-weight:700;margin:24px 0 12px;border-bottom:2px solid #e2e4f0;padding-bottom:8px">Invoice Milestones</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f4f5fb">
          <th style="text-align:left;padding:8px 12px;color:#1a1f5e;font-weight:700;font-size:11px;text-transform:uppercase">Description</th>
          <th style="text-align:right;padding:8px 12px;color:#1a1f5e;font-weight:700;font-size:11px;text-transform:uppercase">Amount</th>
          <th style="text-align:left;padding:8px 12px;color:#1a1f5e;font-weight:700;font-size:11px;text-transform:uppercase">Due</th>
          <th style="text-align:left;padding:8px 12px;color:#1a1f5e;font-weight:700;font-size:11px;text-transform:uppercase">Status</th>
        </tr>
      </thead>
      <tbody>
        ${project.invoiceMilestones.map((m, i) => `
          <tr style="background:${i % 2 === 0 ? "white" : "#fafafa"};border-top:1px solid #e2e4f0">
            <td style="padding:8px 12px;color:#374151">${m.description}</td>
            <td style="padding:8px 12px;text-align:right;font-weight:600;color:#1a1f5e">${m.currency ?? "USD"} ${m.amount.toLocaleString()}</td>
            <td style="padding:8px 12px;color:#6b7280;font-size:12px">${fmt(m.dueDate)}</td>
            <td style="padding:8px 12px">
              <span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${m.status === "PAID" ? "#dcfce7" : m.status === "INVOICED" ? "#dbeafe" : "#f3f4f6"};color:${m.status === "PAID" ? "#166534" : m.status === "INVOICED" ? "#1d4ed8" : "#6b7280"}">
                ${m.status}
              </span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  const historyHtml = project.statusHistory.length > 0 ? `
    <h2 style="color:#1a1f5e;font-size:15px;font-weight:700;margin:24px 0 12px;border-bottom:2px solid #e2e4f0;padding-bottom:8px">Status History</h2>
    <div style="position:relative;padding-left:24px">
      <div style="position:absolute;left:6px;top:4px;bottom:4px;width:2px;background:#e2e4f0"></div>
      ${project.statusHistory.map((h) => `
        <div style="position:relative;margin-bottom:16px">
          <div style="position:absolute;left:-20px;top:3px;width:10px;height:10px;border-radius:50%;background:#1a1f5e;border:2px solid white;box-shadow:0 0 0 2px #e2e4f0"></div>
          <p style="font-size:13px;font-weight:600;color:#1a1f5e;margin:0 0 2px">${STATUS_LABELS[h.toStatus] ?? h.toStatus}${h.fromStatus ? ` <span style="font-weight:400;color:#9ca3af;font-size:11px">← ${STATUS_LABELS[h.fromStatus] ?? h.fromStatus}</span>` : ""}</p>
          <p style="font-size:11px;color:#9ca3af;margin:0">${fmt(h.changedAt)}${h.changedBy ? ` · ${h.changedBy.name}` : ""}</p>
          ${h.notes ? `<p style="font-size:12px;color:#6b7280;margin:4px 0 0;font-style:italic">${h.notes}</p>` : ""}
        </div>
      `).join("")}
    </div>
  ` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Report — ${project.projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; color: #374151; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    @page { margin: 1.5cm; }
  </style>
</head>
<body>
  <!-- KGR Header -->
  <div style="background:#1a1f5e;padding:20px 32px;display:flex;align-items:center;gap:16px;margin-bottom:0">
    <div>
      <span style="color:#d4a017;font-weight:800;font-size:24px;letter-spacing:-0.5px">KGR</span>
      <span style="color:rgba(255,255,255,0.7);font-size:14px;margin-left:10px">iDemand Portal</span>
    </div>
    <div style="flex:1;text-align:right">
      <p style="color:rgba(255,255,255,0.5);font-size:11px">Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
    </div>
  </div>

  <!-- Project Name Bar -->
  <div style="background:#f4f5fb;border-bottom:1px solid #e2e4f0;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <div>
      <h1 style="font-size:18px;font-weight:800;color:#1a1f5e">${project.projectName}</h1>
      <p style="font-size:12px;color:#9ca3af;margin-top:2px">ID: ${project.id.slice(0, 8).toUpperCase()} · ${SCOPE_LABELS[project.scopeOfWork] ?? project.scopeOfWork}</p>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:${ragColor}18;color:${ragColor};border:1px solid ${ragColor}30">
        <span style="width:8px;height:8px;border-radius:50%;background:${ragColor};display:inline-block"></span>
        ${project.ragStatus}
      </span>
      <span style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:#1a1f5e18;color:#1a1f5e">
        ${statusLabel}
      </span>
    </div>
  </div>

  <div style="padding:32px">
    <!-- Two-column: Project Details + Commercial Summary -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:24px">
      <!-- Project Details -->
      <div>
        <h2 style="color:#1a1f5e;font-size:15px;font-weight:700;margin:0 0 12px;border-bottom:2px solid #e2e4f0;padding-bottom:8px">Project Details</h2>
        <table style="width:100%;border-collapse:collapse">
          ${row("Location", project.location)}
          ${row("Region", p.region)}
          ${row("Start Date", fmt(project.anticipatedStartDate))}
          ${row("End Date", fmt(project.anticipatedEndDate))}
          ${row("Scope", SCOPE_LABELS[project.scopeOfWork] ?? project.scopeOfWork)}
          ${row("Submitted By", project.submittedBy.name)}
          ${row("Assigned To", project.assignedResource?.name ?? "Unassigned")}
          ${p.numberOfFtes ? row("FTEs", `${p.numberOfFtes}`) : ""}
          ${p.requestingDepartment ? row("Department", p.requestingDepartment) : ""}
          ${p.businessOwner ? row("Business Owner", p.businessOwner) : ""}
          ${p.priority ? row("Priority", p.priority) : ""}
        </table>
        ${project.description ? `
          <div style="margin-top:16px">
            <p style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:4px">Description</p>
            <p style="font-size:13px;color:#374151;line-height:1.5">${project.description}</p>
          </div>
        ` : ""}
      </div>

      <!-- Commercial Summary -->
      <div>
        <h2 style="color:#1a1f5e;font-size:15px;font-weight:700;margin:0 0 12px;border-bottom:2px solid #e2e4f0;padding-bottom:8px">Commercial Summary</h2>
        <table style="width:100%;border-collapse:collapse">
          ${project.estimatedCost ? row("Estimated Cost", `USD ${project.estimatedCost.toLocaleString()}`) : ""}
          ${p.poValue ? row("PO Value", `${p.poCurrency ?? "USD"} ${p.poValue.toLocaleString()}`) : ""}
          ${project.poNumber ? row("PO Number", project.poNumber) : ""}
          ${(p.invoicedAmount ?? 0) > 0 ? row("Invoiced Amount", `USD ${(p.invoicedAmount ?? 0).toLocaleString()}`) : ""}
          ${p.paymentTermsDays ? row("Payment Terms", `Net ${p.paymentTermsDays}`) : ""}
          ${p.contractType ? row("Contract Type", p.contractType.replace(/_/g, " ")) : ""}
          ${p.serviceTier ? row("Service Tier", p.serviceTier) : ""}
          ${row("Budget Available", project.budgetAvailable ? "Yes" : "No")}
        </table>
        ${project.notes ? `
          <div style="margin-top:16px;padding:12px;background:#f4f5fb;border-radius:8px;border:1px solid #e2e4f0">
            <p style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:4px">Notes</p>
            <p style="font-size:13px;color:#374151;line-height:1.5">${project.notes}</p>
          </div>
        ` : ""}
      </div>
    </div>

    ${resourcesHtml}
    ${invoicesHtml}
    ${historyHtml}
  </div>

  <!-- Footer -->
  <div style="border-top:1px solid #e2e4f0;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;background:#f4f5fb;margin-top:32px">
    <p style="font-size:11px;color:#9ca3af">KGR End User Services · Powered by iDemand</p>
    <p style="font-size:11px;color:#9ca3af">Confidential — For internal use only</p>
  </div>

  <!-- Print button (hidden when printing) -->
  <div class="no-print" style="position:fixed;bottom:24px;right:24px">
    <button onclick="window.print()" style="background:#1a1f5e;color:#d4a017;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(26,31,94,0.3)">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="project-${id}-report.html"`,
    },
  });
}
