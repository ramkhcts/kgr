import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  try {
    await prisma.notification.create({ data: { userId, title, body, url } });
  } catch {
    /* non-critical */
  }
}
