import clsx from "clsx";

const RAG_CONFIG = {
  RED: { color: "#dc2626", bg: "#fef2f2", label: "Red" },
  AMBER: { color: "#d97706", bg: "#fffbeb", label: "Amber" },
  GREEN: { color: "#16a34a", bg: "#f0fdf4", label: "Green" },
};

export function RAGBadge({ status }: { status: string }) {
  const cfg = RAG_CONFIG[status as keyof typeof RAG_CONFIG] ?? RAG_CONFIG.GREEN;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}
    >
      <span className="rag-dot" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}
