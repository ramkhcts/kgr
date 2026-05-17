import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fields = await prisma.formField.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(fields);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { fieldKey, label, type, required, options, placeholder, hint, section, sortOrder } = body;

    if (!fieldKey || !label || !type) {
      return NextResponse.json({ error: "fieldKey, label, and type are required" }, { status: 400 });
    }

    // Check for unique fieldKey
    const existing = await prisma.formField.findUnique({ where: { fieldKey } });
    if (existing) {
      return NextResponse.json({ error: "A field with that key already exists" }, { status: 400 });
    }

    const field = await prisma.formField.create({
      data: {
        fieldKey,
        label,
        type,
        required: required ?? false,
        options: options ? JSON.stringify(options) : null,
        placeholder: placeholder ?? null,
        hint: hint ?? null,
        section: section ?? "details",
        sortOrder: sortOrder ?? 100,
        isCore: false,
        isActive: true,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (err) {
    console.error("Form field create error:", err);
    return NextResponse.json({ error: "Failed to create form field" }, { status: 500 });
  }
}
