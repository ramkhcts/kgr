import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  const pmoRoles = ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"];
  if (!pmoRoles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const skills = await prisma.userSkill.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(skills);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (!["SUPER_ADMIN", "PMO_LEAD"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { skillName, certificationBody, expiryDate, proficiencyLevel } = body;

  if (!skillName || typeof skillName !== "string" || skillName.trim().length === 0) {
    return NextResponse.json({ error: "skillName is required" }, { status: 400 });
  }

  const skill = await prisma.userSkill.create({
    data: {
      userId: id,
      skillName: skillName.trim(),
      certificationBody: certificationBody || null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      proficiencyLevel: proficiencyLevel || null,
    },
  });

  return NextResponse.json(skill, { status: 201 });
}
