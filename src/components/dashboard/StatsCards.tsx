import Link from "next/link";
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

interface StatsCardsProps {
  total: number;
  active: number;
  needsAction: number;
  closedThisMonth: number;
  slaBreached?: number;
}

const CARDS = [
  {
    key:   "total"          as const,
    label: "Total Projects",
    icon:  <TrendingUp size={20} />,
    color: "#1a1f5e",
    href:  "/projects",
    hint:  "View all",
  },
  {
    key:   "active"         as const,
    label: "Active Pipeline",
    icon:  <Clock size={20} />,
    color: "#3d2d8e",
    href:  "/projects?filter=active",
    hint:  "View active",
  },
  {
    key:   "needsAction"    as const,
    label: "Needs Action",
    icon:  <AlertTriangle size={20} />,
    color: "#d97706",
    href:  "/projects?filter=action",
    hint:  "View mine",
  },
  {
    key:   "closedThisMonth" as const,
    label: "Closed This Month",
    icon:  <CheckCircle2 size={20} />,
    color: "#16a34a",
    href:  "/projects?filter=closed",
    hint:  "View closed",
  },
];

const SLA_CARD_CONFIG = {
  key:   "slaBreached" as const,
  label: "SLA Breached",
  icon:  <AlertTriangle size={20} />,
  href:  "/projects?filter=sla_breach",
  hint:  "View breached",
};

export function StatsCards(props: StatsCardsProps) {
  const colClass = props.slaBreached !== undefined
    ? "grid grid-cols-2 lg:grid-cols-5 gap-4"
    : "grid grid-cols-2 lg:grid-cols-4 gap-4";

  return (
    <div className={colClass}>
      {CARDS.map(({ key, label, icon, color, href, hint }) => (
        <Link
          key={key}
          href={href}
          className="card-elevated p-5 group block transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-500 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-800 mt-1" style={{ color }}>{props[key]}</p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
              style={{ backgroundColor: color + "15", color }}
            >
              {icon}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <p className="text-xs font-600 transition-colors duration-150" style={{ color }}>
              {hint}
            </p>
            <ArrowRight
              size={11}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
              style={{ color }}
            />
          </div>
        </Link>
      ))}

      {props.slaBreached !== undefined && (() => {
        const color = (props.slaBreached ?? 0) > 0 ? "#dc2626" : "#16a34a";
        return (
          <Link
            href={SLA_CARD_CONFIG.href}
            className="card-elevated p-5 group block transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-500 uppercase tracking-wide">{SLA_CARD_CONFIG.label}</p>
                <p className="text-3xl font-800 mt-1" style={{ color }}>{props.slaBreached}</p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                style={{ backgroundColor: color + "15", color }}
              >
                {SLA_CARD_CONFIG.icon}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <p className="text-xs font-600 transition-colors duration-150" style={{ color }}>
                {SLA_CARD_CONFIG.hint}
              </p>
              <ArrowRight
                size={11}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
                style={{ color }}
              />
            </div>
          </Link>
        );
      })()}
    </div>
  );
}
