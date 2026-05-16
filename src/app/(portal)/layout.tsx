import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SessionProvider } from "next-auth/react";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-[#f4f5fb]">
        <Sidebar userRole={user.role} userName={user.name} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar userName={user.name} userRole={user.role} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
