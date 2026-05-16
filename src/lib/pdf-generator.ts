import { format } from "date-fns";

type ProjectData = {
  id: string;
  projectName: string;
  description: string;
  scopeOfWork: string;
  location: string;
  anticipatedStartDate: Date | string;
  anticipatedEndDate: Date | string;
  estimatedCost?: number | null;
  notes?: string | null;
  submittedBy: { name: string; email: string };
};

type RateCardEntry = {
  roleName: string;
  hourlyRate: number;
  dailyRate: number;
};

const SCOPE_LABELS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};

export async function generateSOWPDF(
  project: ProjectData,
  rateCardEntries: RateCardEntry[]
): Promise<Buffer> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(26, 31, 94);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setTextColor(212, 160, 23);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("KGR End User Services", 14, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Statement of Work", 14, 24);
  doc.text("Customer: KarthikLLC", 14, 31);
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated: ${format(new Date(), "MMMM dd, yyyy")}`, pageW - 14, 31, { align: "right" });

  // Title
  doc.setTextColor(26, 31, 94);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(project.projectName, 14, 50);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`SOW Reference: SOW-${project.id.slice(0, 8).toUpperCase()}`, 14, 57);

  // Project details table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 31, 94);
  doc.text("1. Project Overview", 14, 68);

  autoTable(doc, {
    startY: 72,
    head: [],
    body: [
      ["Project Name", project.projectName],
      ["Scope of Work", SCOPE_LABELS[project.scopeOfWork] ?? project.scopeOfWork],
      ["Location", project.location],
      ["Start Date", format(new Date(project.anticipatedStartDate), "MMMM dd, yyyy")],
      ["End Date", format(new Date(project.anticipatedEndDate), "MMMM dd, yyyy")],
      ["Requested By", `${project.submittedBy.name} (${project.submittedBy.email})`],
      ["Customer", "KarthikLLC"],
      ["Service Provider", "KGR End User Services"],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 58, fillColor: [244, 245, 251] },
      1: { cellWidth: 122 },
    },
    styles: { fontSize: 9, cellPadding: 3.5 },
    theme: "grid",
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Description
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 31, 94);
  doc.text("2. Description & Scope", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const splitDesc = doc.splitTextToSize(project.description, pageW - 28);
  doc.text(splitDesc, 14, y);
  y += splitDesc.length * 5 + 10;

  if (project.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    const splitNotes = doc.splitTextToSize(`Notes: ${project.notes}`, pageW - 28);
    doc.text(splitNotes, 14, y);
    y += splitNotes.length * 5 + 8;
  }

  // Rate card
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 31, 94);
  doc.text("3. Pricing (Per Agreed MSA Rate Card)", 14, y);

  autoTable(doc, {
    startY: y + 5,
    head: [["Role", "Hourly Rate (USD)", "Daily Rate (USD)"]],
    body: rateCardEntries.map((r) => [r.roleName, `$${r.hourlyRate.toFixed(2)}`, `$${r.dailyRate.toFixed(2)}`]),
    headStyles: { fillColor: [26, 31, 94], textColor: [212, 160, 23], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 245, 251] },
    styles: { fontSize: 9 },
    theme: "grid",
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (project.estimatedCost) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 31, 94);
    doc.text(`Estimated Project Cost: $${project.estimatedCost.toLocaleString()}`, 14, y);
    y += 12;
  }

  // Signature block
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 31, 94);
  doc.text("4. Acceptance & Signatures", 14, y);
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("KGR Authorized Signatory", 14, y);
  doc.line(14, y + 10, 90, y + 10);
  doc.text("Date: _______________", 14, y + 16);

  doc.text("KarthikLLC Authorized Signatory", 110, y);
  doc.line(110, y + 10, 195, y + 10);
  doc.text("Date: _______________", 110, y + 16);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "KGR End User Services — Confidential — For KarthikLLC Use Only",
    pageW / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}
