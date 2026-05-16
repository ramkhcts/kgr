import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/enums";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as SessionUser;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}
