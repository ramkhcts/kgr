import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile } from "@/lib/upload";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename } = await params;
  const buffer = readFile(filename);
  if (!buffer) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const contentType = filename.endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
