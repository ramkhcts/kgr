import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const poNumber = formData.get("poNumber") as string;

    let poDocumentPath: string | undefined;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `po-${id}.pdf`;
      saveFile(filename, buffer);
      poDocumentPath = filename;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        poNumber: poNumber || undefined,
        poDocumentPath: poDocumentPath || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to upload PO" }, { status: 500 });
  }
}
