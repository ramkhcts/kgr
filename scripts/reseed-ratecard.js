/**
 * Plain Node.js script to reseed rate card with global regional data.
 * Run on server: node scripts/reseed-ratecard.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const RATE_CARDS = [
  // ── NA ──────────────────────────────────────────────────────────────
  { region: "NA", serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 55, dailyRate: 440, currency: "USD" },
  { region: "NA", serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer",    hourlyRate: 75, dailyRate: 600, currency: "USD" },
  { region: "NA", serviceType: "SERVICE_DESK",           roleName: "Service Desk Analyst",    hourlyRate: 45, dailyRate: 360, currency: "USD" },
  { region: "NA", serviceType: "SERVICE_DESK",           roleName: "Service Desk Lead",        hourlyRate: 65, dailyRate: 520, currency: "USD" },
  { region: "NA", serviceType: "REMOTE_COMMAND_CENTER",  roleName: "RCC Operator",             hourlyRate: 60, dailyRate: 480, currency: "USD" },
  { region: "NA", serviceType: "REMOTE_COMMAND_CENTER",  roleName: "RCC Shift Supervisor",     hourlyRate: 80, dailyRate: 640, currency: "USD" },
  { region: "NA", serviceType: "FIELD_SERVICES",         roleName: "Field Services Technician",hourlyRate: 70, dailyRate: 560, currency: "USD" },
  { region: "NA", serviceType: "FIELD_SERVICES",         roleName: "Field Services Engineer",  hourlyRate: 90, dailyRate: 720, currency: "USD" },

  // ── EMEA ─────────────────────────────────────────────────────────────
  { region: "EMEA", serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 48, dailyRate: 384, currency: "EUR" },
  { region: "EMEA", serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer",    hourlyRate: 68, dailyRate: 544, currency: "EUR" },
  { region: "EMEA", serviceType: "SERVICE_DESK",           roleName: "Service Desk Analyst",    hourlyRate: 40, dailyRate: 320, currency: "EUR" },
  { region: "EMEA", serviceType: "SERVICE_DESK",           roleName: "Service Desk Lead",        hourlyRate: 58, dailyRate: 464, currency: "EUR" },
  { region: "EMEA", serviceType: "REMOTE_COMMAND_CENTER",  roleName: "RCC Operator",             hourlyRate: 52, dailyRate: 416, currency: "EUR" },
  { region: "EMEA", serviceType: "REMOTE_COMMAND_CENTER",  roleName: "RCC Shift Supervisor",     hourlyRate: 72, dailyRate: 576, currency: "EUR" },
  { region: "EMEA", serviceType: "FIELD_SERVICES",         roleName: "Field Services Technician",hourlyRate: 62, dailyRate: 496, currency: "EUR" },
  { region: "EMEA", serviceType: "FIELD_SERVICES",         roleName: "Field Services Engineer",  hourlyRate: 82, dailyRate: 656, currency: "EUR" },

  // ── LATAM ─────────────────────────────────────────────────────────────
  { region: "LATAM", serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 28, dailyRate: 224, currency: "USD" },
  { region: "LATAM", serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer",    hourlyRate: 42, dailyRate: 336, currency: "USD" },
  { region: "LATAM", serviceType: "SERVICE_DESK",           roleName: "Service Desk Analyst",    hourlyRate: 22, dailyRate: 176, currency: "USD" },
  { region: "LATAM", serviceType: "SERVICE_DESK",           roleName: "Service Desk Lead",        hourlyRate: 35, dailyRate: 280, currency: "USD" },
  { region: "LATAM", serviceType: "REMOTE_COMMAND_CENTER",  roleName: "RCC Operator",             hourlyRate: 32, dailyRate: 256, currency: "USD" },
  { region: "LATAM", serviceType: "REMOTE_COMMAND_CENTER",  roleName: "RCC Shift Supervisor",     hourlyRate: 48, dailyRate: 384, currency: "USD" },
  { region: "LATAM", serviceType: "FIELD_SERVICES",         roleName: "Field Services Technician",hourlyRate: 38, dailyRate: 304, currency: "USD" },
  { region: "LATAM", serviceType: "FIELD_SERVICES",         roleName: "Field Services Engineer",  hourlyRate: 55, dailyRate: 440, currency: "USD" },

  // ── ASPAC ─────────────────────────────────────────────────────────────
  { region: "ASPAC", serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 35, dailyRate: 280, currency: "USD" },
  { region: "ASPAC", serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer",    hourlyRate: 52, dailyRate: 416, currency: "USD" },
  { region: "ASPAC", serviceType: "SERVICE_DESK",           roleName: "Service Desk Analyst",    hourlyRate: 28, dailyRate: 224, currency: "USD" },
  { region: "ASPAC", serviceType: "SERVICE_DESK",           roleName: "Service Desk Lead",        hourlyRate: 44, dailyRate: 352, currency: "USD" },
  { region: "ASPAC", serviceType: "REMOTE_COMMAND_CENTER",  roleName: "RCC Operator",             hourlyRate: 40, dailyRate: 320, currency: "USD" },
  { region: "ASPAC", serviceType: "REMOTE_COMMAND_CENTER",  roleName: "RCC Shift Supervisor",     hourlyRate: 58, dailyRate: 464, currency: "USD" },
  { region: "ASPAC", serviceType: "FIELD_SERVICES",         roleName: "Field Services Technician",hourlyRate: 45, dailyRate: 360, currency: "USD" },
  { region: "ASPAC", serviceType: "FIELD_SERVICES",         roleName: "Field Services Engineer",  hourlyRate: 65, dailyRate: 520, currency: "USD" },
];

async function main() {
  console.log("Deleting existing rate card entries...");
  const deleted = await prisma.rateCard.deleteMany({});
  console.log(`Deleted ${deleted.count} entries.`);

  console.log("Inserting 32 global rate card entries...");
  for (const entry of RATE_CARDS) {
    await prisma.rateCard.create({
      data: { ...entry, isActive: true },
    });
  }

  const count = await prisma.rateCard.count();
  const byRegion = await prisma.rateCard.groupBy({ by: ["region"], _count: true });
  console.log(`\nDone. Total entries: ${count}`);
  console.log("By region:", byRegion.map(r => `${r.region}: ${r._count}`).join(", "));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
