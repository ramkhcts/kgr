import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isPMO() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) return null;
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await isPMO();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { roleName, hourlyRate, dailyRate, currency, region, serviceType } = body;

  const entry = await prisma.rateCard.update({
    where: { id },
    data: {
      ...(roleName    !== undefined && { roleName }),
      ...(hourlyRate  !== undefined && { hourlyRate: parseFloat(String(hourlyRate)) }),
      ...(dailyRate   !== undefined && { dailyRate:  parseFloat(String(dailyRate)) }),
      ...(currency    !== undefined && { currency }),
      ...(region      !== undefined && { region }),
      ...(serviceType !== undefined && { serviceType }),
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await isPMO();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Soft-delete: mark inactive rather than hard-delete
  const entry = await prisma.rateCard.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(entry);
}
