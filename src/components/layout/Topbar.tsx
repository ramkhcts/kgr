"use client";
import { Menu, Sun, Moon } from "lucide-react";
import { KarthikLLCLogo } from "./KarthikLLCLogo";
import { NotificationBell } from "./NotificationBell";
import { ROLE_LABELS } from "@/types/enums";
import { usePortal } from "./PortalContext";

export function Topbar({ userName, userRole }: { userName: string; userRole: string }) {
  const { theme, toggleTheme, setSidebarOpen } = usePortal();

  return (
    <header className="h-14 bg-white border-b border-[#e2e4f0] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-[#f4f5fb] text-gray-500 hover:text-[#1a1f5e] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <p className="text-xs text-gray-500 hidden sm:block">KarthikLLC — End User Services</p>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[#f4f5fb] text-gray-400 hover:text-[#1a1f5e] transition-colors"
          title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Live notification bell */}
        <NotificationBell userRole={userRole} />

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <KarthikLLCLogo size={26} />
          </div>
          <div className="text-right">
            <p className="text-sm font-600 text-[#1a1f5e] leading-tight">{userName}</p>
            <p className="text-[11px] text-gray-500 leading-tight hidden sm:block">
              {ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
