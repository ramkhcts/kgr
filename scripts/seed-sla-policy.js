process.env.DATABASE_URL = "file:./dev.db";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SLA_DEFAULTS = [
  { status: "SUBMITTED",            targetDays: 1,  warningDays: 0 },
  { status: "UNDER_REVIEW",         targetDays: 3,  warningDays: 1 },
  { status: "INFO_REQUIRED",        targetDays: 5,  warningDays: 2 },
  { status: "SOLUTIONING",          targetDays: 10, warningDays: 3 },
  { status: "SOW_DRAFT",            targetDays: 5,  warningDays: 2 },
  { status: "SOW_APPROVAL",         targetDays: 7,  warningDays: 2 },
  { status: "SOW_SIGNED",           targetDays: 2,  warningDays: 1 },
  { status: "PO_REQUESTED",         targetDays: 10, warningDays: 3 },
  { status: "PO_RECEIVED",          targetDays: 3,  warningDays: 1 },
  { status: "RESOURCE_ASSIGNED",    targetDays: 3,  warningDays: 1 },
  { status: "HANDED_TO_OPERATIONS", targetDays: 2,  warningDays: 1 },
];

async function main() {
  for (const entry of SLA_DEFAULTS) {
    await prisma.sLAPolicy.upsert({
      where: { status: entry.status },
      update: { targetDays: entry.targetDays, warningDays: entry.warningDays },
      create: entry,
    });
  }
  console.log("SLA policies seeded.");
  await prisma.$disconnect();
}
main().catch(console.error);
