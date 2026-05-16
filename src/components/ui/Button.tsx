"use client";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, children, className, disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

  const variants = {
    primary: "bg-[#1a1f5e] text-[#d4a017] hover:bg-[#12174a] focus:ring-[#1a1f5e]",
    secondary: "bg-[#3d2d8e] text-white hover:bg-[#2d1f7e] focus:ring-[#3d2d8e]",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    ghost: "bg-transparent text-[#1a1f5e] hover:bg-[#f4f5fb] focus:ring-[#1a1f5e]",
    outline: "bg-white text-[#1a1f5e] border border-[#e2e4f0] hover:bg-[#f4f5fb] focus:ring-[#1a1f5e]",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-2.5",
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
