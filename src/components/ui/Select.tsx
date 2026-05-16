import clsx from "clsx";
import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-600 text-[#1a1f5e]">
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={clsx(
            "w-full rounded-lg border px-3 py-2 text-sm text-[#1a1f5e] focus:outline-none focus:ring-2 focus:ring-[#1a1f5e] focus:border-transparent transition-colors appearance-none cursor-pointer",
            error ? "border-red-400 bg-red-50" : "border-[#e2e4f0] bg-white hover:border-[#1a1f5e]/30",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
