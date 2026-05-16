import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "CUSTOMER_APPROVER") {
    return NextResponse.json({ error: "Only Customer Approvers can sign SOWs" }, { status: 403 });
  }

  const { id } = await params;
  const { signatureDataUrl } = await req.json();

  if (!signatureDataUrl) {
    return NextResponse.json({ error: "Signature data required" }, { status: 400 });
  }

  // Save signature image as a record
  const signatureFilename = `signature-${id}.png`;
  const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  saveFile(signatureFilename, buffer);

  const updated = await prisma.project.update({
    where: { id },
    data: {
      signatureDataUrl: signatureDataUrl,
      signedSowPath: signatureFilename,
      status: "SOW_SIGNED",
    },
  });

  await prisma.statusHistory.create({
    data: { projectId: id, fromStatus: "SOW_APPROVAL", toStatus: "SOW_SIGNED", changedById: user.id, notes: "Digitally signed by customer" },
  });

  return NextResponse.json(updated);
}
