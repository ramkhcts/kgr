import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_ORDER = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INFO_REQUIRED",
  "SOLUTIONING",
  "SOW_DRAFT",
  "SOW_APPROVAL",
  "SOW_SIGNED",
  "PO_REQUESTED",
  "PO_RECEIVED",
  "RESOURCE_ASSIGNED",
  "HANDED_TO_OPERATIONS",
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const policies = await prisma.sLAPolicy.findMany();

  // Sort by STATUS_ORDER
  policies.sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status);
    const bi = STATUS_ORDER.indexOf(b.status);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return NextResponse.json(policies);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { policies } = body as { policies: Array<{ id: string; targetDays: number; warningDays: number }> };

  if (!Array.isArray(policies)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates = await Promise.all(
    policies.map((p) =>
      prisma.sLAPolicy.update({
        where: { id: p.id },
        data: {
          targetDays: Number(p.targetDays),
          warningDays: Number(p.warningDays),
        },
      })
    )
  );

  return NextResponse.json(updates);
}
