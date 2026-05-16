"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  CreditCard,
  Users,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { KGRLogo } from "./KGRLogo";
import { signOut } from "next-auth/react";
import { ROLE_LABELS } from "@/types/enums";
import { usePortal } from "./PortalContext";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",       href: "/dashboard",    icon: <LayoutDashboard size={18} />, roles: ["CLIENT", "PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"] },
  { label: "All Projects",    href: "/projects",     icon: <FolderKanban size={18} />,   roles: ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"] },
  { label: "My Requests",     href: "/projects",     icon: <FolderKanban size={18} />,   roles: ["CLIENT"] },
  { label: "New Request",     href: "/projects/new", icon: <PlusCircle size={18} />,     roles: ["CLIENT"] },
  { label: "Rate Card",       href: "/rate-card",    icon: <CreditCard size={18} />,     roles: ["CLIENT", "PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"] },
  { label: "User Management", href: "/admin",        icon: <Users size={18} />,          roles: ["PMO_LEAD", "SUPER_ADMIN"] },
];

export function Sidebar({ userRole, userName }: { userRole: string; userName: string }) {
  const pathname = usePathname();
  const { theme, sidebarOpen, setSidebarOpen } = usePortal();
  const isLight = theme === "light";

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const content = (
    <aside
      className={clsx(
        "relative w-64 min-h-screen flex flex-col flex-shrink-0 transition-colors duration-200",
        isLight ? "bg-white border-r border-[#e2e4f0]" : "sidebar-gradient"
      )}
    >
      {/* Mobile close button */}
      <button
        onClick={() => setSidebarOpen(false)}
        className={clsx(
          "absolute top-4 right-3 md:hidden p-1.5 rounded-lg transition-colors",
          isLight ? "text-gray-400 hover:bg-gray-100" : "text-white/50 hover:bg-white/10"
        )}
      >
        <X size={18} />
      </button>

      {/* Logo */}
      <div className={clsx("px-5 py-5 border-b", isLight ? "border-[#e2e4f0]" : "border-white/10")}>
        <div className="flex items-center gap-3">
          <KGRLogo size={36} />
          <div>
            <p className={clsx("font-800 text-sm leading-tight", isLight ? "text-[#1a1f5e]" : "text-[#d4a017]")}>KGR</p>
            <p className={clsx("text-[10px] leading-tight", isLight ? "text-gray-400" : "text-white/60")}>iDemand Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label + item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-500 transition-all duration-150 group",
                active
                  ? isLight
                    ? "bg-[#1a1f5e] text-white"
                    : "bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/30"
                  : isLight
                    ? "text-gray-500 hover:text-[#1a1f5e] hover:bg-[#f4f5fb]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <span
                className={clsx(
                  "flex-shrink-0",
                  active
                    ? isLight ? "text-white" : "text-[#d4a017]"
                    : isLight ? "text-gray-400 group-hover:text-[#1a1f5e]" : "text-white/50 group-hover:text-white/80"
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {active && (
                <ChevronRight size={14} className={clsx("flex-shrink-0", isLight ? "text-white" : "text-[#d4a017]")} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className={clsx("px-3 py-4 border-t", isLight ? "border-[#e2e4f0]" : "border-white/10")}>
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div
            className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-700 flex-shrink-0",
              isLight ? "bg-[#1a1f5e]/10 text-[#1a1f5e]" : "bg-[#d4a017]/30 text-[#d4a017]"
            )}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className={clsx("text-xs font-600 truncate", isLight ? "text-[#1a1f5e]" : "text-white")}>{userName}</p>
            <p className={clsx("text-[10px] truncate", isLight ? "text-gray-400" : "text-white/40")}>
              {ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={clsx(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-500 transition-colors",
            isLight
              ? "text-gray-500 hover:text-red-600 hover:bg-red-50"
              : "text-white/60 hover:text-red-400 hover:bg-red-500/10"
          )}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar: fixed overlay on mobile, static on desktop */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 md:static md:z-auto",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {content}
      </div>
    </>
  );
}
