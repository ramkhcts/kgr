import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const milestones = await prisma.invoiceMilestone.findMany({
    where: { projectId: id },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { description, amount, dueDate } = body;

  if (!description || amount === undefined) {
    return NextResponse.json({ error: "description and amount are required" }, { status: 400 });
  }

  const milestone = await prisma.invoiceMilestone.create({
    data: {
      projectId: id,
      description,
      amount: parseFloat(amount),
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json(milestone, { status: 201 });
}
