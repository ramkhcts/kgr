"use client";
import { useEffect } from "react";

/**
 * Reads localStorage on mount and applies the data-theme attribute to <html>.
 * Uses a useEffect to avoid hydration mismatches.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("kgr-theme") as "light" | "dark" | null;
    const theme = saved === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return <>{children}</>;
}
