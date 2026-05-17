"use client";
import { usePortal } from "@/components/layout/PortalContext";
import { Check } from "lucide-react";

export function AppearanceCard() {
  const { theme, toggleTheme } = usePortal();

  const themes: { value: "light" | "dark"; label: string; bg: string; accent: string; textPrimary: string; textSecondary: string }[] = [
    {
      value: "light",
      label: "Light",
      bg: "bg-white",
      accent: "bg-[#1a1f5e]",
      textPrimary: "bg-[#1a1f5e]",
      textSecondary: "bg-gray-300",
    },
    {
      value: "dark",
      label: "Dark",
      bg: "bg-[#0f1422]",
      accent: "bg-[#3d2d8e]",
      textPrimary: "bg-white",
      textSecondary: "bg-gray-600",
    },
  ];

  return (
    <div className="flex gap-4">
      {themes.map((t) => {
        const isActive = theme === t.value;
        return (
          <button
            key={t.value}
            onClick={() => { if (theme !== t.value) toggleTheme(); }}
            className={`relative flex-1 rounded-xl border-2 p-4 transition-all cursor-pointer text-left ${
              isActive ? "border-[#1a1f5e] shadow-md" : "border-[#e2e4f0] hover:border-[#1a1f5e]/40"
            }`}
          >
            {/* Preview box */}
            <div className={`rounded-lg overflow-hidden mb-3 h-20 ${t.bg} border border-[#e2e4f0]/50 relative`}>
              {/* Fake sidebar */}
              <div className={`absolute left-0 top-0 bottom-0 w-8 ${t.accent} opacity-80`} />
              {/* Fake content lines */}
              <div className="absolute left-10 top-3 right-2 space-y-1.5">
                <div className={`h-2 rounded ${t.textPrimary} opacity-70 w-3/4`} />
                <div className={`h-2 rounded ${t.textSecondary} opacity-50 w-1/2`} />
                <div className={`h-2 rounded ${t.textSecondary} opacity-50 w-2/3`} />
              </div>
            </div>

            <p className="text-sm font-600 text-[#1a1f5e]">{t.label}</p>

            {/* Checkmark */}
            {isActive && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-[#1a1f5e] rounded-full flex items-center justify-center">
                <Check size={11} className="text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
