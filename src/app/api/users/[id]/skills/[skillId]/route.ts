import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (!["SUPER_ADMIN", "PMO_LEAD"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, skillId } = await params;

  const skill = await prisma.userSkill.findUnique({ where: { id: skillId } });
  if (!skill || skill.userId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.userSkill.delete({ where: { id: skillId } });
  return NextResponse.json({ ok: true });
}
