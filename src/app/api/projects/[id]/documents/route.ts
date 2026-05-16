import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const documents = await prisma.document.findMany({
    where: { projectId: id },
    select: { id: true, name: true, type: true, mimeType: true, size: true, createdAt: true, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "OTHER";
    const name = (formData.get("name") as string) || file?.name || "document";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const doc = await prisma.document.create({
      data: {
        projectId: id,
        name,
        type,
        mimeType: file.type || "application/octet-stream",
        size: buffer.length,
        content: buffer,
        uploadedById: user.id,
      },
      select: { id: true, name: true, type: true, mimeType: true, size: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: { projectId: id, userId: user.id, action: `Document uploaded: ${name} (${type})` },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
