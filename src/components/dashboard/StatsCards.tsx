import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface StatsCardsProps {
  total: number;
  active: number;
  needsAction: number;
  closedThisMonth: number;
}

const CARDS = [
  { key: "total" as const, label: "Total Projects", icon: <TrendingUp size={20} />, color: "#1a1f5e" },
  { key: "active" as const, label: "Active Pipeline", icon: <Clock size={20} />, color: "#3d2d8e" },
  { key: "needsAction" as const, label: "Needs Action", icon: <AlertTriangle size={20} />, color: "#d97706" },
  { key: "closedThisMonth" as const, label: "Closed This Month", icon: <CheckCircle2 size={20} />, color: "#16a34a" },
];

export function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, icon, color }) => (
        <div key={key} className="card-elevated p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-500 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-800 mt-1" style={{ color }}>{props[key]}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15", color }}>
              {icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
