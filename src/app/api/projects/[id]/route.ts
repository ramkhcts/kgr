import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true, role: true } },
      assignedResource: { select: { id: true, name: true, email: true, role: true } },
      statusHistory: {
        include: { changedBy: { select: { id: true, name: true } } },
        orderBy: { changedAt: "desc" },
      },
      documents: {
        select: { id: true, name: true, type: true, mimeType: true, size: true, createdAt: true, uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;
  const body = await req.json();

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isPmoLead = user.role === "PMO_LEAD";

  // Fields PMO_LEAD can update
  const pmoLeadFields = ["ragStatus", "sowNotes", "notes", "estimatedCost", "infoRequestMessage", "poNumber",
    "anticipatedStartDate", "anticipatedEndDate", "closureNotes"];
  // Additional fields only SUPER_ADMIN can update
  const superAdminOnlyFields = ["projectName", "description", "location"];

  if (!isSuperAdmin && !isPmoLead && !["PMO_TEAM"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = isSuperAdmin ? [...pmoLeadFields, ...superAdminOnlyFields] : pmoLeadFields;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      if (key === "anticipatedStartDate" || key === "anticipatedEndDate") {
        data[key] = new Date(body[key] as string);
      } else {
        data[key] = body[key];
      }
    }
  }

  const updated = await prisma.project.update({ where: { id }, data });
  return NextResponse.json(updated);
}
