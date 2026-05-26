import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function firstWord(location: string): string {
  return location.split(/[\s,]+/)[0] ?? location;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scopeOfWork = searchParams.get("scopeOfWork");
  const location    = searchParams.get("location");
  const region      = searchParams.get("region");

  if (!scopeOfWork || !location || !region) {
    return NextResponse.json([], { status: 200 });
  }

  const similar = await prisma.project.findMany({
    where: {
      scopeOfWork,
      region,
      status: { notIn: ["CLOSED_SUCCESS", "CANCELLED"] },
      location: { contains: firstWord(location) },
    },
    select: { id: true, projectName: true, status: true, location: true },
    take: 3,
  });

  return NextResponse.json(similar);
}
