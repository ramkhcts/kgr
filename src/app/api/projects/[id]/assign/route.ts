import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PROGRAM_MANAGER", "SOLUTIONING_TEAM"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { resourceUserId } = await req.json();

  const resource = await prisma.user.findUnique({ where: { id: resourceUserId } });
  if (!resource) return NextResponse.json({ error: "Resource user not found" }, { status: 404 });

  const updated = await prisma.project.update({
    where: { id },
    data: { assignedResourceId: resourceUserId },
    include: { assignedResource: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(updated);
}
