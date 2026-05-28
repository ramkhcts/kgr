import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string };

  const skills = await prisma.userSkill.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string };

  const PMO_ROLES = ["PMO_TEAM", "PMO_LEAD", "SUPER_ADMIN"];
  if (!PMO_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { skillName, certificationBody, proficiencyLevel, expiryDate } = body;

  if (!skillName || typeof skillName !== "string" || !skillName.trim()) {
    return NextResponse.json({ error: "skillName is required" }, { status: 400 });
  }

  const skill = await prisma.userSkill.create({
    data: {
      userId: user.id,
      skillName: skillName.trim(),
      certificationBody: certificationBody?.trim() || null,
      proficiencyLevel: proficiencyLevel || null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    },
  });

  return NextResponse.json(skill, { status: 201 });
}
