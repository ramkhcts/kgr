import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = await req.json();
    const { label, placeholder, hint, required, options, sortOrder, isActive } = body;

    const field = await prisma.formField.findUnique({ where: { id } });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    const updated = await prisma.formField.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(placeholder !== undefined ? { placeholder } : {}),
        ...(hint !== undefined ? { hint } : {}),
        ...(required !== undefined ? { required } : {}),
        ...(options !== undefined ? { options: Array.isArray(options) ? JSON.stringify(options) : options } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Form field update error:", err);
    return NextResponse.json({ error: "Failed to update form field" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const field = await prisma.formField.findUnique({ where: { id } });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    if (field.isCore) {
      return NextResponse.json({ error: "Cannot delete core fields" }, { status: 400 });
    }

    await prisma.formField.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Form field delete error:", err);
    return NextResponse.json({ error: "Failed to delete form field" }, { status: 500 });
  }
}
