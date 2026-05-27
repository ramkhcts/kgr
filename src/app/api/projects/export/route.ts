import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

function csvEscape(val: unknown): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function csvRow(fields: unknown[]): string {
  return fields.map(csvEscape).join(",");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filterParam = searchParams.get("filter") ?? "";
  const scope = searchParams.get("scope") ?? "";
  const region = searchParams.get("region") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  if (filterParam === "sla_breach") {
    where.slaBreached = true;
  } else if (filterParam) {
    where.status = filterParam;
  }

  if (scope) where.scopeOfWork = scope;
  if (region) where.region = region;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      submittedBy: { select: { name: true } },
      assignedResource: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Project ID",
    "Project Name",
    "Status",
    "RAG Status",
    "Priority",
    "Urgency",
    "Region",
    "Scope of Work",
    "Location",
    "Requesting Department",
    "Business Owner",
    "Business Justification",
    "Anticipated Start",
    "Anticipated End",
    "Number of FTEs",
    "Coverage Model",
    "Workplace Model",
    "Incumbent Vendor",
    "Compliance Notes",
    "Estimated Cost",
    "PO Number",
    "PO Value",
    "Invoiced Amount",
    "SLA Target Date",
    "SLA Breached",
    "Submitted By",
    "Assigned Resource",
    "Created At",
    "Updated At",
  ];

  const rows: string[] = [headers.join(",")];

  for (const p of projects) {
    const pp = p as typeof p & {
      priority?: string;
      urgency?: string;
      requestingDepartment?: string | null;
      businessOwner?: string | null;
      businessJustification?: string | null;
      numberOfFtes?: number | null;
      coverageModel?: string | null;
      workplaceModel?: string | null;
      incumbentVendor?: string | null;
      complianceNotes?: string | null;
      poValue?: number | null;
      invoicedAmount?: number | null;
      slaTargetDate?: Date | null;
      slaBreached?: boolean;
    };

    rows.push(
      csvRow([
        p.id,
        p.projectName,
        p.status,
        p.ragStatus,
        pp.priority ?? "",
        pp.urgency ?? "",
        p.region,
        p.scopeOfWork,
        p.location,
        pp.requestingDepartment ?? "",
        pp.businessOwner ?? "",
        pp.businessJustification ?? "",
        format(new Date(p.anticipatedStartDate), "yyyy-MM-dd"),
        format(new Date(p.anticipatedEndDate), "yyyy-MM-dd"),
        pp.numberOfFtes ?? "",
        pp.coverageModel ?? "",
        pp.workplaceModel ?? "",
        pp.incumbentVendor ?? "",
        pp.complianceNotes ?? "",
        p.estimatedCost ?? "",
        p.poNumber ?? "",
        pp.poValue ?? "",
        pp.invoicedAmount ?? "",
        pp.slaTargetDate ? format(new Date(pp.slaTargetDate), "yyyy-MM-dd") : "",
        pp.slaBreached ? "Yes" : "No",
        p.submittedBy?.name ?? "",
        p.assignedResource?.name ?? "",
        format(new Date(p.createdAt), "yyyy-MM-dd"),
        format(new Date(p.updatedAt), "yyyy-MM-dd"),
      ])
    );
  }

  const csv = rows.join("\r\n");
  const today = format(new Date(), "yyyy-MM-dd");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="projects-export-${today}.csv"`,
    },
  });
}
