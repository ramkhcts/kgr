import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — own notifications, last 20, unread first
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string };

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 20,
  });

  return NextResponse.json(notifications);
}

// POST — create a notification (internal use)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId, title, body: notifBody, url } = body;

  if (!userId || !title || !notifBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: { userId, title, body: notifBody, url },
  });

  return NextResponse.json(notification, { status: 201 });
}
