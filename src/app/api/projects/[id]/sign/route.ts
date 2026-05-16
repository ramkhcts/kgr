import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "CLIENT") {
    return NextResponse.json({ error: "Only Clients can sign SOWs" }, { status: 403 });
  }

  const { id } = await params;
  const { signatureDataUrl } = await req.json();

  if (!signatureDataUrl) {
    return NextResponse.json({ error: "Signature data required" }, { status: 400 });
  }

  const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Save signature as a Document record
  await prisma.document.create({
    data: {
      projectId: id,
      name: `Signed SOW - ${project.projectName}.png`,
      type: "SIGNED_SOW",
      mimeType: "image/png",
      size: buffer.length,
      content: buffer,
      uploadedById: user.id,
    },
  });

  const updated = await prisma.project.update({
    where: { id },
    data: { status: "SOW_SIGNED" },
  });

  await prisma.statusHistory.create({
    data: { projectId: id, fromStatus: "SOW_APPROVAL", toStatus: "SOW_SIGNED", changedById: user.id, notes: "Digitally signed by client" },
  });

  return NextResponse.json(updated);
}
