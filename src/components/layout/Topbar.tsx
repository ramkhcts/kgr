"use client";
import { useRef, useState, useEffect } from "react";
import { Menu, Sun, Moon, Settings, LogOut, ChevronDown } from "lucide-react";
import { KarthikLLCLogo } from "./KarthikLLCLogo";
import { NotificationBell } from "./NotificationBell";
import { ROLE_LABELS } from "@/types/enums";
import { usePortal } from "./PortalContext";
import { signOut } from "next-auth/react";
import Link from "next/link";

function getAvatarBg(role: string): string {
  if (role === "PMO_LEAD" || role === "SUPER_ADMIN") return "bg-[#1a1f5e]";
  if (role === "PMO_TEAM") return "bg-[#3d2d8e]";
  return "bg-[#6366f1]"; // CLIENT
}

export function Topbar({
  userName,
  userRole,
  userEmail,
}: {
  userName: string;
  userRole: string;
  userEmail?: string;
}) {
  const { theme, toggleTheme, setSidebarOpen } = usePortal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = userName?.charAt(0)?.toUpperCase() ?? "?";
  const avatarBg = getAvatarBg(userRole);
  const roleLabel = ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole;

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleMouseDown);
    }
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

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
        {/* Live notification bell */}
        <NotificationBell userRole={userRole} />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[#f4f5fb] transition-colors"
            aria-label="User menu"
          >
            {/* Avatar circle */}
            <div
              className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-white text-sm font-700 flex-shrink-0`}
            >
              {initial}
            </div>
            <span className="hidden sm:block text-sm font-600 text-[#1a1f5e] max-w-[120px] truncate">
              {userName}
            </span>
            <ChevronDown
              size={14}
              className={`hidden sm:block text-gray-400 transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-[#e2e4f0] z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#f4f5fb]">
                <div
                  className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center text-white text-base font-700 flex-shrink-0`}
                >
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-700 text-[#1a1f5e] truncate">{userName}</p>
                  <p className="text-[11px] text-[#3d2d8e] font-600">{roleLabel}</p>
                  {userEmail && (
                    <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>
                  )}
                </div>
              </div>

              <div className="h-px bg-[#e2e4f0]" />

              {/* Settings */}
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f4f5fb] hover:text-[#1a1f5e] transition-colors"
              >
                <Settings size={15} className="text-gray-400" />
                Settings
              </Link>

              {/* Theme toggle */}
              <button
                onClick={() => {
                  toggleTheme();
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f4f5fb] hover:text-[#1a1f5e] transition-colors"
              >
                {theme === "light" ? (
                  <Moon size={15} className="text-gray-400" />
                ) : (
                  <Sun size={15} className="text-gray-400" />
                )}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </button>

              <div className="h-px bg-[#e2e4f0]" />

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} className="text-red-400" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
