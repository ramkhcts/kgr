"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

interface PortalContextType {
  theme: Theme;
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const PortalContext = createContext<PortalContextType>({
  theme: "dark",
  toggleTheme: () => {},
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kgr-theme") as Theme | null;
    const t = saved === "light" ? "light" : "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("kgr-theme", next);
  };

  return (
    <PortalContext.Provider value={{ theme, toggleTheme, sidebarOpen, setSidebarOpen }}>
      {children}
    </PortalContext.Provider>
  );
}

export const usePortal = () => useContext(PortalContext);
