import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_RATE_CARD = [
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 55, dailyRate: 440 },
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer", hourlyRate: 75, dailyRate: 600 },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Analyst", hourlyRate: 45, dailyRate: 360 },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Lead", hourlyRate: 65, dailyRate: 520 },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Operator", hourlyRate: 60, dailyRate: 480 },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Shift Supervisor", hourlyRate: 80, dailyRate: 640 },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Technician", hourlyRate: 70, dailyRate: 560 },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Engineer", hourlyRate: 90, dailyRate: 720 },
];

async function main() {
  console.log("🌱 Seeding database...");

  const hash = await bcrypt.hash("kgr2024!", 10);

  // Users
  const alice = await prisma.user.upsert({
    where: { email: "alice@kgr.com" },
    update: {},
    create: { email: "alice@kgr.com", name: "Alice Johnson", passwordHash: hash, role: "PROGRAM_MANAGER" },
  });
  const bob = await prisma.user.upsert({
    where: { email: "bob@kgr.com" },
    update: {},
    create: { email: "bob@kgr.com", name: "Bob Chen", passwordHash: hash, role: "SOLUTIONING_TEAM" },
  });
  const carol = await prisma.user.upsert({
    where: { email: "carol@kgr.com" },
    update: {},
    create: { email: "carol@kgr.com", name: "Carol White", passwordHash: hash, role: "SOLUTIONING_TEAM" },
  });
  const david = await prisma.user.upsert({
    where: { email: "david@karthikllc.com" },
    update: {},
    create: { email: "david@karthikllc.com", name: "David Park", passwordHash: hash, role: "BUSINESS_USER" },
  });
  const emma = await prisma.user.upsert({
    where: { email: "emma@karthikllc.com" },
    update: {},
    create: { email: "emma@karthikllc.com", name: "Emma Torres", passwordHash: hash, role: "BUSINESS_USER" },
  });
  const frank = await prisma.user.upsert({
    where: { email: "frank@karthikllc.com" },
    update: {},
    create: { email: "frank@karthikllc.com", name: "Frank Miller", passwordHash: hash, role: "CUSTOMER_APPROVER" },
  });
  const grace = await prisma.user.upsert({
    where: { email: "grace@karthikllc.com" },
    update: {},
    create: { email: "grace@karthikllc.com", name: "Grace Lee", passwordHash: hash, role: "CUSTOMER_APPROVER" },
  });

  console.log("✅ Users created");

  // Rate card
  await prisma.rateCard.deleteMany();
  await prisma.rateCard.createMany({
    data: DEFAULT_RATE_CARD.map((r) => ({ ...r, currency: "USD" })),
  });
  console.log("✅ Rate card seeded");

  // 10 Sample Projects
  const projectsData = [
    {
      projectName: "Dallas HQ Desk Refresh",
      description: "Complete refresh of 120 workstations at Dallas headquarters including hardware upgrades, OS reimaging, and peripheral replacement as part of the annual tech refresh cycle.",
      scopeOfWork: "SITE_SUPPORT_SERVICES",
      location: "Dallas, TX",
      anticipatedStartDate: new Date("2024-01-10"),
      anticipatedEndDate: new Date("2024-02-28"),
      budgetAvailable: true,
      notes: "Q1 priority project. Coordinated with facilities team for after-hours access.",
      status: "CLOSED_SUCCESS",
      ragStatus: "GREEN",
      estimatedCost: 52800,
      submittedById: david.id,
      assignedResourceId: bob.id,
    },
    {
      projectName: "NYC Service Desk Expansion",
      description: "Expand the New York service desk capacity by onboarding 15 additional analysts to support the growing 3,500-seat user base following the Midtown office consolidation.",
      scopeOfWork: "SERVICE_DESK",
      location: "New York, NY",
      anticipatedStartDate: new Date("2024-03-01"),
      anticipatedEndDate: new Date("2024-12-31"),
      budgetAvailable: true,
      notes: "SLA targets: P1 <15 min, P2 <2 hrs. Bilingual support required.",
      status: "RESOURCE_ASSIGNED",
      ragStatus: "GREEN",
      estimatedCost: 234000,
      submittedById: emma.id,
      assignedResourceId: carol.id,
      poNumber: "PO-2024-0312",
    },
    {
      projectName: "Chicago RCC Standby Coverage",
      description: "Provide 24/7 Remote Command Center standby coverage for the Chicago data center during the planned network infrastructure upgrade. Coverage required for 6 weeks.",
      scopeOfWork: "REMOTE_COMMAND_CENTER",
      location: "Chicago, IL",
      anticipatedStartDate: new Date("2024-04-15"),
      anticipatedEndDate: new Date("2024-05-31"),
      budgetAvailable: true,
      notes: "Night shift differential applies. Security clearance required for all RCC operators.",
      status: "PO_RECEIVED",
      ragStatus: "AMBER",
      estimatedCost: 67200,
      submittedById: david.id,
      poNumber: "PO-2024-0489",
    },
    {
      projectName: "Austin Field Rollout Q3",
      description: "Deploy and configure 450 new endpoint devices across 3 Austin campuses as part of Q3 hardware refresh. Includes on-site setup, user data migration, and end-user orientation.",
      scopeOfWork: "FIELD_SERVICES",
      location: "Austin, TX",
      anticipatedStartDate: new Date("2024-07-01"),
      anticipatedEndDate: new Date("2024-09-30"),
      budgetAvailable: true,
      notes: "Staggered rollout by campus. Campus A first, then B and C simultaneously.",
      status: "PO_REQUESTED",
      ragStatus: "GREEN",
      estimatedCost: 176400,
    },
    {
      projectName: "Seattle SOW Signature Pending",
      description: "Establish a dedicated service desk team for the Seattle Innovation Hub, providing Tier 1 and Tier 2 support for 800 engineers and product staff.",
      scopeOfWork: "SITE_SUPPORT_SERVICES",
      location: "Seattle, WA",
      anticipatedStartDate: new Date("2024-05-01"),
      anticipatedEndDate: new Date("2025-04-30"),
      budgetAvailable: true,
      notes: "Must align with Seattle lease start date. SaaS-heavy environment.",
      status: "SOW_APPROVAL",
      ragStatus: "AMBER",
      estimatedCost: 312000,
      submittedById: emma.id,
    },
    {
      projectName: "Miami Service Desk Pilot",
      description: "Pilot a centralized service desk model for the Miami regional office (250 seats) to validate the standardized KGR service model before full Southeast rollout.",
      scopeOfWork: "SERVICE_DESK",
      location: "Miami, FL",
      anticipatedStartDate: new Date("2024-06-01"),
      anticipatedEndDate: new Date("2024-08-31"),
      budgetAvailable: false,
      notes: "Budget approval pending from regional CFO. Proceed with SOW drafting in parallel.",
      status: "SOW_DRAFT",
      ragStatus: "GREEN",
      estimatedCost: 46800,
      submittedById: david.id,
    },
    {
      projectName: "Boston Solutioning Review",
      description: "Implement RCC monitoring and escalation procedures for the Boston financial trading floor, requiring 24/7 coverage with sub-5-minute incident response SLA.",
      scopeOfWork: "REMOTE_COMMAND_CENTER",
      location: "Boston, MA",
      anticipatedStartDate: new Date("2024-08-01"),
      anticipatedEndDate: new Date("2025-07-31"),
      budgetAvailable: true,
      notes: "Regulatory compliance requirements apply — FINRA and SEC reporting integration needed.",
      status: "SOLUTIONING",
      ragStatus: "GREEN",
      estimatedCost: 560000,
      submittedById: emma.id,
    },
    {
      projectName: "Denver Info Pending",
      description: "Field deployment support for new POS terminal rollout across 35 Denver retail locations, including installation, configuration, and staff training.",
      scopeOfWork: "FIELD_SERVICES",
      location: "Denver, CO",
      anticipatedStartDate: new Date("2024-09-01"),
      anticipatedEndDate: new Date("2024-10-15"),
      budgetAvailable: true,
      notes: "Rollout must be completed before the holiday season. Retail hours only.",
      status: "INFO_REQUIRED",
      ragStatus: "RED",
      infoRequestMessage: "Please clarify the exact number of POS terminals per location, the current network infrastructure at each site, and whether staff training is to be conducted on-site or remotely. This impacts our resource and timeline estimate significantly.",
      submittedById: david.id,
    },
    {
      projectName: "Atlanta New Request Under Review",
      description: "Provide dedicated service desk support for the Atlanta customer experience center handling inbound support requests from KarthikLLC end-customers via phone, email, and chat.",
      scopeOfWork: "SERVICE_DESK",
      location: "Atlanta, GA",
      anticipatedStartDate: new Date("2024-10-01"),
      anticipatedEndDate: new Date("2025-09-30"),
      budgetAvailable: true,
      notes: "Omni-channel support required. CRM integration with Salesforce Service Cloud.",
      status: "UNDER_REVIEW",
      ragStatus: "GREEN",
      estimatedCost: 273600,
      submittedById: emma.id,
    },
    {
      projectName: "Portland Emergency RCC",
      description: "Emergency Remote Command Center support needed for the Portland distribution center following the departure of their in-house NOC team. Immediate coverage required.",
      scopeOfWork: "REMOTE_COMMAND_CENTER",
      location: "Portland, OR",
      anticipatedStartDate: new Date("2024-05-20"),
      anticipatedEndDate: new Date("2024-11-19"),
      budgetAvailable: true,
      notes: "URGENT — Current coverage expires in 2 weeks. Emergency procurement process invoked.",
      status: "SUBMITTED",
      ragStatus: "AMBER",
      estimatedCost: 184320,
      submittedById: david.id,
    },
  ];

  // Clean up existing projects and history for idempotent seeding
  await prisma.auditLog.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.project.deleteMany();

  for (const pd of projectsData) {
    const project = await prisma.project.create({
      data: {
        projectName: pd.projectName,
        description: pd.description,
        scopeOfWork: pd.scopeOfWork,
        location: pd.location,
        anticipatedStartDate: pd.anticipatedStartDate,
        anticipatedEndDate: pd.anticipatedEndDate,
        budgetAvailable: pd.budgetAvailable,
        notes: pd.notes || null,
        status: pd.status,
        ragStatus: pd.ragStatus,
        estimatedCost: pd.estimatedCost || null,
        submittedById: pd.submittedById || david.id,
        assignedResourceId: (pd as { assignedResourceId?: string }).assignedResourceId || null,
        poNumber: (pd as { poNumber?: string }).poNumber || null,
        infoRequestMessage: (pd as { infoRequestMessage?: string }).infoRequestMessage || null,
      },
    });

    // Create status history trail
    const statusTrail: string[] = ["SUBMITTED"];
    const STATUS_ORDER = [
      "SUBMITTED", "UNDER_REVIEW", "SOLUTIONING", "SOW_DRAFT",
      "SOW_APPROVAL", "SOW_SIGNED", "PO_REQUESTED", "PO_RECEIVED",
      "RESOURCE_ASSIGNED", "CLOSED_SUCCESS",
    ];
    const currentIdx = STATUS_ORDER.indexOf(pd.status);
    for (let i = 1; i <= currentIdx; i++) {
      statusTrail.push(STATUS_ORDER[i]);
    }
    if (pd.status === "INFO_REQUIRED") statusTrail.push("UNDER_REVIEW", "INFO_REQUIRED");
    if (pd.status === "UNDER_REVIEW") statusTrail.push("UNDER_REVIEW");

    for (let i = 1; i < statusTrail.length; i++) {
      await prisma.statusHistory.create({
        data: {
          projectId: project.id,
          fromStatus: statusTrail[i - 1],
          toStatus: statusTrail[i],
          changedById: i % 2 === 0 ? bob.id : alice.id,
          notes: null,
        },
      });
    }
  }

  console.log("✅ 10 sample projects seeded");
  console.log("\n🎉 Seed complete! Login credentials:");
  console.log("   alice@kgr.com / kgr2024! — Program Manager");
  console.log("   bob@kgr.com / kgr2024! — Solutioning Team");
  console.log("   david@karthikllc.com / kgr2024! — Business User");
  console.log("   frank@karthikllc.com / kgr2024! — Customer Approver");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
