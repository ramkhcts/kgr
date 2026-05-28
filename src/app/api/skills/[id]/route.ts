import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string };

  const { id } = await params;

  const skill = await prisma.userSkill.findUnique({ where: { id }, select: { userId: true } });
  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (skill.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden — you can only delete your own skills" }, { status: 403 });
  }

  await prisma.userSkill.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
