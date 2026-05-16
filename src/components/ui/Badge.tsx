import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={clsx("status-badge", className)}
      style={color ? { backgroundColor: color + "22", color, borderColor: color + "44", border: "1px solid" } : undefined}
    >
      {children}
    </span>
  );
}
