"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface Props {
  data: { week: string; count: number }[];
}

export function WeeklyIntakeTrend({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e4f0] p-5">
      <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">
        Weekly Intake Trend
      </p>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="intakeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a1f5e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1a1f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e4f0" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e4f0" }}
              labelStyle={{ color: "#1a1f5e", fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#1a1f5e"
              strokeWidth={2}
              fill="url(#intakeFill)"
              dot={{ r: 3, fill: "#1a1f5e" }}
              activeDot={{ r: 5 }}
              name="Projects"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

