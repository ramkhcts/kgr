"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, PlusCircle, Users } from "lucide-react";
import clsx from "clsx";

export function MobileNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const isPMO = ["PMO_LEAD", "PMO_TEAM", "SUPER_ADMIN"].includes(userRole);

  const items = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Projects", href: "/projects", icon: <FolderKanban size={20} /> },
    ...(userRole === "CLIENT"
      ? [{ label: "New Request", href: "/projects/new", icon: <PlusCircle size={20} />, highlight: true }]
      : []),
    ...(isPMO
      ? [{ label: "Admin", href: "/admin", icon: <Users size={20} /> }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#e2e4f0] flex md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const isHighlight = "highlight" in item && item.highlight;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-600 transition-colors",
              isHighlight
                ? "text-white bg-[#1a1f5e] rounded-t-xl mx-1 -mt-2 shadow-lg"
                : active
                  ? "text-[#1a1f5e]"
                  : "text-gray-400 hover:text-[#1a1f5e]"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
