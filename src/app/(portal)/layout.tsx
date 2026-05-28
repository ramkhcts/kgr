import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionProvider } from "next-auth/react";
import { PortalProvider } from "@/components/layout/PortalContext";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <SessionProvider>
      <ThemeProvider>
      <PortalProvider>
        <div className="flex h-screen overflow-hidden bg-[#f4f5fb]">
          <Sidebar userRole={user.role} userName={user.name} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Topbar userName={user.name} userRole={user.role} userEmail={user.email} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
              {children}
            </main>
          </div>
        </div>
        <MobileNav userRole={user.role} />
      </PortalProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
