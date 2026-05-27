import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_LEAD", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, invoiceId } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.description !== undefined) updateData.description = body.description;
  if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.invoicedAt !== undefined) updateData.invoicedAt = body.invoicedAt ? new Date(body.invoicedAt) : null;
  if (body.paidAt !== undefined) updateData.paidAt = body.paidAt ? new Date(body.paidAt) : null;

  if (body.status !== undefined) {
    updateData.status = body.status;
    if (body.status === "INVOICED" && !body.invoicedAt) {
      updateData.invoicedAt = new Date();
    }
    if (body.status === "PAID" && !body.paidAt) {
      updateData.paidAt = new Date();
    }
  }

  const milestone = await prisma.invoiceMilestone.update({
    where: { id: invoiceId, projectId: id },
    data: updateData,
  });

  // Recalculate invoicedAmount on the project
  const totalInvoiced = await prisma.invoiceMilestone.aggregate({
    where: { projectId: id, status: { in: ["INVOICED", "PAID"] } },
    _sum: { amount: true },
  });

  await prisma.project.update({
    where: { id },
    data: { invoicedAmount: totalInvoiced._sum.amount ?? 0 },
  });

  return NextResponse.json(milestone);
}
