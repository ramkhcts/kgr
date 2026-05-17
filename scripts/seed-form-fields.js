// Run: node scripts/seed-form-fields.js
process.env.DATABASE_URL = "file:./dev.db";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CORE_FIELDS = [
  { fieldKey: "projectName",           label: "Project Name",         type: "text",     required: true,  placeholder: "e.g. Dallas HQ Service Desk Upgrade", sortOrder: 1,  isCore: true, section: "basics" },
  { fieldKey: "description",           label: "Project Description",  type: "textarea", required: true,  placeholder: "Provide a detailed description...",    sortOrder: 2,  isCore: true, section: "basics" },
  { fieldKey: "scopeOfWork",           label: "Scope of Work",        type: "dropdown", required: true,  options: JSON.stringify(["SITE_SUPPORT_SERVICES","SERVICE_DESK","REMOTE_COMMAND_CENTER","FIELD_SERVICES"]), sortOrder: 3, isCore: true, section: "basics" },
  { fieldKey: "location",              label: "Location",             type: "text",     required: true,  placeholder: "e.g. Dallas, TX",                      sortOrder: 4,  isCore: true, section: "basics" },
  { fieldKey: "region",                label: "Region",               type: "dropdown", required: true,  options: JSON.stringify(["NA","EMEA","LATAM","ASPAC"]), sortOrder: 5, isCore: true, section: "basics" },
  { fieldKey: "anticipatedStartDate",  label: "Anticipated Start Date", type: "date",   required: true,  sortOrder: 6,  isCore: true, section: "timeline" },
  { fieldKey: "anticipatedEndDate",    label: "Anticipated End Date", type: "date",     required: true,  sortOrder: 7,  isCore: true, section: "timeline" },
  { fieldKey: "budgetAvailable",       label: "Budget Available",     type: "checkbox", required: true,  sortOrder: 8,  isCore: true, section: "basics" },
  { fieldKey: "notes",                 label: "Additional Notes",     type: "textarea", required: false, placeholder: "Any other relevant details...",         sortOrder: 9,  isCore: true, section: "basics" },
];

async function main() {
  for (const f of CORE_FIELDS) {
    await prisma.formField.upsert({
      where: { fieldKey: f.fieldKey },
      update: { label: f.label, placeholder: f.placeholder ?? null, sortOrder: f.sortOrder },
      create: f,
    });
  }
  console.log("Form fields seeded.");
  await prisma.$disconnect();
}
main().catch(console.error);
