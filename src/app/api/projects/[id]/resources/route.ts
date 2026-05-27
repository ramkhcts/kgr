import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resources = await prisma.projectResource.findMany({
    where: { projectId: id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(resources);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
    userId, roleName, dailyRate, currency, startDate, endDate, isLead, notes,
    bgCheckStatus, shiftPattern, rampUpEndDate, rampDownStartDate,
    externalResourceName, externalResourceEmail,
  } = body;

  if (!roleName || dailyRate === undefined) {
    return NextResponse.json({ error: "roleName and dailyRate are required" }, { status: 400 });
  }
  if (!dailyRate || parseFloat(dailyRate) <= 0) {
    return NextResponse.json({ error: "Daily rate must be greater than 0" }, { status: 400 });
  }

  // Check existing resources to determine if this should be the lead
  const existingCount = await prisma.projectResource.count({ where: { projectId: id } });
  const shouldBeLead = isLead === true || existingCount === 0;

  const resource = await prisma.projectResource.create({
    data: {
      projectId: id,
      userId: userId || null,
      roleName,
      dailyRate: parseFloat(dailyRate),
      currency: currency ?? "USD",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isLead: shouldBeLead,
      notes: notes || null,
      bgCheckStatus: bgCheckStatus || null,
      shiftPattern: shiftPattern || null,
      rampUpEndDate: rampUpEndDate ? new Date(rampUpEndDate) : null,
      rampDownStartDate: rampDownStartDate ? new Date(rampDownStartDate) : null,
      externalResourceName: externalResourceName || null,
      externalResourceEmail: externalResourceEmail || null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  // If isLead, update project.assignedResourceId
  if (shouldBeLead && userId) {
    await prisma.project.update({
      where: { id },
      data: { assignedResourceId: userId },
    });
  }

  return NextResponse.json(resource, { status: 201 });
}
