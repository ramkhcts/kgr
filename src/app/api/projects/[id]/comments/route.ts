import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  try {
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Clients can only comment on their own projects
    if (user.role === "CLIENT" && project.submittedById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: { projectId: id, userId: user.id, content: content.trim() },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;
  const { commentId } = await req.json();

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only comment author or PMO_LEAD can delete
  if (comment.userId !== user.id && user.role !== "PMO_LEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
