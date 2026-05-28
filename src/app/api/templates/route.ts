import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.projectTemplate.findMany({
    where: { isActive: true },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, scopeOfWork, coverageModel, workplaceModel, numberOfFtes, region, contractType, serviceTier, priority, notes } = body;

  if (!name || !scopeOfWork) {
    return NextResponse.json({ error: "Name and scope are required" }, { status: 400 });
  }

  const template = await prisma.projectTemplate.create({
    data: {
      name,
      description: description ?? null,
      scopeOfWork,
      coverageModel: coverageModel ?? null,
      workplaceModel: workplaceModel ?? null,
      numberOfFtes: numberOfFtes ? parseInt(String(numberOfFtes)) : null,
      region: region ?? "NA",
      contractType: contractType ?? null,
      serviceTier: serviceTier ?? null,
      priority: priority ?? "MEDIUM",
      notes: notes ?? null,
      createdById: user.id,
    },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(template, { status: 201 });
}
