import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const isClient = user.role === "CLIENT";

  const roleFilter = isClient ? { submittedById: user.id } : {};

  const projects = await prisma.project.findMany({
    where: {
      AND: [
        roleFilter,
        {
          OR: [
            { projectName: { contains: q } },
            { location: { contains: q } },
            { description: { contains: q } },
          ],
        },
        { status: { notIn: ["CANCELLED"] } },
      ],
    },
    select: {
      id: true,
      projectName: true,
      status: true,
      location: true,
    },
    take: 8,
  });

  // SQLite is case-sensitive; do a JS-side case-insensitive filter as additional pass
  const lower = q.toLowerCase();
  const filtered = projects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(lower) ||
      p.location.toLowerCase().includes(lower)
  );

  // If JS filter eliminated some, also run the original (DB already filtered, just use all)
  const results = (filtered.length > 0 ? filtered : projects).map((p) => ({
    type: "project",
    id: p.id,
    title: p.projectName,
    subtitle: `${p.status.replace(/_/g, " ")} · ${p.location}`,
    url: `/projects/${p.id}`,
  }));

  return NextResponse.json(results);
}
