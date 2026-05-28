"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { Menu, Sun, Moon, Settings, LogOut, ChevronDown, Search, Bell, CheckCircle2, X } from "lucide-react";
import { KarthikLLCLogo } from "./KarthikLLCLogo";
import { ROLE_LABELS } from "@/types/enums";
import { usePortal } from "./PortalContext";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getAvatarBg(role: string): string {
  if (role === "PMO_LEAD" || role === "SUPER_ADMIN") return "bg-[#1a1f5e]";
  if (role === "PMO_TEAM") return "bg-[#3d2d8e]";
  return "bg-[#6366f1]";
}

type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  url: string;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleNotifClick(n: Notification) {
    markRead(n.id);
    setOpen(false);
    if (n.url) router.push(n.url);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-[#f4f5fb] text-gray-400 hover:text-[#1a1f5e] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-700 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#e2e4f0] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e2e4f0] flex items-center justify-between">
            <p className="text-sm font-700 text-[#1a1f5e]">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#3d2d8e] hover:underline font-600"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#f0f1f8]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 flex flex-col items-center gap-2">
                <CheckCircle2 size={28} className="text-green-400" />
                <p className="text-sm font-600 text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#f4f5fb] transition-colors ${
                    !n.read ? "border-l-2 border-blue-500" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.read ? "font-700 text-[#1a1f5e]" : "font-500 text-gray-700"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMobileExpanded(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
        setFocusedIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setMobileExpanded(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && focusedIdx >= 0 && results[focusedIdx]) {
      navigate(results[focusedIdx].url);
    }
  }

  function navigate(url: string) {
    router.push(url);
    setOpen(false);
    setQuery("");
    setMobileExpanded(false);
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Mobile: icon that expands */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-[#f4f5fb] text-gray-400 hover:text-[#1a1f5e] transition-colors"
        onClick={() => {
          setMobileExpanded((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label="Search"
      >
        <Search size={18} />
      </button>

      {/* Mobile expanded overlay */}
      {mobileExpanded && (
        <div className="absolute left-0 top-0 -translate-y-0 w-[calc(100vw-80px)] md:hidden z-50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects…"
              className="w-full pl-8 pr-8 py-2 text-sm border border-[#e2e4f0] rounded-lg bg-white shadow focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
              autoFocus
            />
            <button
              onClick={() => { setMobileExpanded(false); setQuery(""); setOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop search bar */}
      <div className="hidden md:block relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search projects…"
          className="w-56 xl:w-72 pl-9 pr-3 py-1.5 text-sm border border-[#e2e4f0] rounded-lg bg-[#f4f5fb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/30 transition-colors"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-[#1a1f5e]/30 border-t-[#1a1f5e] rounded-full animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {open && (query.length >= 2) && (
        <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#e2e4f0] z-50 overflow-hidden">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No results for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f1f8]">
              {results.map((r, idx) => (
                <button
                  key={r.id}
                  onClick={() => navigate(r.url)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#f4f5fb] transition-colors ${
                    idx === focusedIdx ? "bg-[#f4f5fb]" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1a1f5e]/10 flex items-center justify-center flex-shrink-0">
                    <Search size={14} className="text-[#1a1f5e]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-600 text-[#1a1f5e] truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
    <header className="h-14 bg-white border-b border-[#e2e4f0] flex items-center justify-between px-4 md:px-6 flex-shrink-0 gap-3">
      <div className="flex items-center gap-3 flex-shrink-0">
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

      {/* Center: search */}
      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {/* Notification bell */}
        <NotificationDropdown />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[#f4f5fb] transition-colors"
            aria-label="User menu"
          >
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
