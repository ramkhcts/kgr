"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  onTrack: number;
  warning: number;
  breached: number;
}

export function SLAComplianceGauge({ onTrack, warning, breached }: Props) {
  const total = onTrack + warning + breached;
  const compliancePct = total === 0 ? 100 : Math.round((onTrack / total) * 100);

  const chartData = [
    { name: "On Track", value: onTrack, color: "#16a34a" },
    { name: "Warning", value: warning, color: "#f59e0b" },
    { name: "Breached", value: breached, color: "#dc2626" },
  ].filter((d) => d.value > 0);

  // If no data, show a placeholder slice
  const displayData = chartData.length > 0 ? chartData : [{ name: "No data", value: 1, color: "#e2e4f0" }];

  return (
    <div className="bg-white rounded-xl border border-[#e2e4f0] p-5">
      <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">
        SLA Compliance
      </p>
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e4f0" }}
              formatter={(value, name) => [`${value as number} project${(value as number) !== 1 ? "s" : ""}`, name as string]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-800 text-[#1a1f5e]">{compliancePct}%</span>
          <span className="text-xs text-gray-400 font-500">On Track</span>
        </div>
      </div>
      {total > 0 && (
        <div className="flex items-center justify-center gap-4 mt-2">
          {[
            { label: "On Track", count: onTrack, color: "bg-green-500" },
            { label: "Warning", count: warning, color: "bg-amber-400" },
            { label: "Breached", count: breached, color: "bg-red-500" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-xs text-gray-500">{label}: {count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
