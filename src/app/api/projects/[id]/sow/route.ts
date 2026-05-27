import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSOWPDF } from "@/lib/pdf-generator";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["PMO_TEAM", "PMO_LEAD"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { submittedBy: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rateCardEntries = await prisma.rateCard.findMany({
    where: { serviceType: project.scopeOfWork, isActive: true },
    orderBy: { hourlyRate: "asc" },
  });

  try {
    const pdfBuffer = await generateSOWPDF(
      { ...project, submittedBy: project.submittedBy },
      rateCardEntries
    );

    // Supersede existing SOW drafts
    await prisma.document.updateMany({
      where: { projectId: id, type: "SOW_DRAFT", supersededAt: null },
      data: { supersededAt: new Date() },
    });

    // Get max version
    const maxVersion = await prisma.document.aggregate({
      where: { projectId: id, type: "SOW_DRAFT" },
      _max: { version: true },
    });
    const nextVersion = (maxVersion._max.version ?? 0) + 1;

    const doc = await prisma.document.create({
      data: {
        projectId: id,
        name: `SOW - ${project.projectName}.pdf`,
        type: "SOW_DRAFT",
        mimeType: "application/pdf",
        size: pdfBuffer.length,
        content: pdfBuffer,
        uploadedById: user.id,
        version: nextVersion,
      },
    });

    const updated = await prisma.project.update({
      where: { id },
      data: { status: "SOW_DRAFT" },
    });

    await prisma.statusHistory.create({
      data: { projectId: id, fromStatus: project.status, toStatus: "SOW_DRAFT", changedById: user.id, notes: "SOW PDF generated" },
    });

    return NextResponse.json({ ...updated, documentId: doc.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate SOW" }, { status: 500 });
  }
}
