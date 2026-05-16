"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, FolderKanban, PlusCircle, CreditCard, Users, LogOut, ChevronRight } from "lucide-react";
import { KGRLogo } from "./KGRLogo";
import { signOut } from "next-auth/react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["BUSINESS_USER", "PROGRAM_MANAGER", "SOLUTIONING_TEAM", "CUSTOMER_APPROVER"] },
  { label: "All Projects", href: "/projects", icon: <FolderKanban size={18} />, roles: ["PROGRAM_MANAGER", "SOLUTIONING_TEAM", "CUSTOMER_APPROVER"] },
  { label: "My Requests", href: "/projects", icon: <FolderKanban size={18} />, roles: ["BUSINESS_USER"] },
  { label: "New Request", href: "/projects/new", icon: <PlusCircle size={18} />, roles: ["BUSINESS_USER"] },
  { label: "Rate Card", href: "/rate-card", icon: <CreditCard size={18} />, roles: ["BUSINESS_USER", "PROGRAM_MANAGER", "SOLUTIONING_TEAM", "CUSTOMER_APPROVER"] },
  { label: "User Management", href: "/admin", icon: <Users size={18} />, roles: ["PROGRAM_MANAGER"] },
];

export function Sidebar({ userRole, userName }: { userRole: string; userName: string }) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="sidebar-gradient w-60 min-h-screen flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <KGRLogo size={36} />
          <div>
            <p className="text-[#d4a017] font-800 text-sm leading-tight">KGR</p>
            <p className="text-white/60 text-[10px] leading-tight">iDemand Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label + item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-500 transition-all duration-150 group",
                active
                  ? "bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/30"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <span className={clsx("flex-shrink-0", active ? "text-[#d4a017]" : "text-white/50 group-hover:text-white/80")}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight size={14} className="text-[#d4a017] flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-[#d4a017] text-xs font-700 flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-600 truncate">{userName}</p>
            <p className="text-white/40 text-[10px] truncate">{userRole.replace(/_/g, " ")}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 text-xs font-500 transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
