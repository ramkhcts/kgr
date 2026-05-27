import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const changeRequests = await prisma.changeRequest.findMany({
    where: { projectId: id },
    include: {
      submittedBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(changeRequests);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  // Only CLIENT (own project) or PMO roles can submit
  const isPMO = ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(user.role);
  const isClient = user.role === "CLIENT";

  if (!isPMO && !isClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check project exists
  const project = await prisma.project.findUnique({ where: { id }, select: { id: true, submittedById: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Client can only submit for their own project
  if (isClient && project.submittedById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, impactScope, impactCost, impactSchedule } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }

  const cr = await prisma.changeRequest.create({
    data: {
      projectId: id,
      submittedById: user.id,
      title,
      description,
      impactScope: impactScope ?? null,
      impactCost: impactCost != null ? parseFloat(impactCost) : null,
      impactSchedule: impactSchedule ?? null,
      status: "PENDING",
    },
    include: {
      submittedBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(cr, { status: 201 });
}
