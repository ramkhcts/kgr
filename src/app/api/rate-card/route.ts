import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.rateCard.findMany({
    where: { isActive: true },
    orderBy: [{ region: "asc" }, { serviceType: "asc" }, { hourlyRate: "asc" }],
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { region, serviceType, roleName, hourlyRate, dailyRate, currency } = body;

  if (!region || !serviceType || !roleName || hourlyRate == null || dailyRate == null || !currency) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const entry = await prisma.rateCard.create({
    data: {
      region,
      serviceType,
      roleName,
      hourlyRate: parseFloat(String(hourlyRate)),
      dailyRate: parseFloat(String(dailyRate)),
      currency,
      isActive: true,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
