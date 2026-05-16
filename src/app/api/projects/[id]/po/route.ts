import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const poNumber = formData.get("poNumber") as string;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await prisma.document.create({
        data: {
          projectId: id,
          name: file.name || `PO - ${project.projectName}.pdf`,
          type: "PO",
          mimeType: file.type || "application/pdf",
          size: buffer.length,
          content: buffer,
          uploadedById: user.id,
        },
      });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { poNumber: poNumber || undefined },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to upload PO" }, { status: 500 });
  }
}
