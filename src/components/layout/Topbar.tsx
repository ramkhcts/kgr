import { Bell } from "lucide-react";
import { KarthikLLCLogo } from "./KarthikLLCLogo";
import { ROLE_LABELS } from "@/types/enums";

export function Topbar({ userName, userRole }: { userName: string; userRole: string }) {
  return (
    <header className="h-14 bg-white border-b border-[#e2e4f0] flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <p className="text-xs text-gray-500">KarthikLLC — End User Services</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-[#f4f5fb] text-gray-400 hover:text-[#1a1f5e] transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <KarthikLLCLogo size={28} />
          <div className="text-right">
            <p className="text-sm font-600 text-[#1a1f5e] leading-tight">{userName}</p>
            <p className="text-[11px] text-gray-500 leading-tight">{ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
