"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { scope: string; region: string; count: number }[];
}

const REGION_COLORS: Record<string, string> = {
  NA: "#1a1f5e",
  EMEA: "#3d2d8e",
  LATAM: "#7c3aed",
  ASPAC: "#0369a1",
};

const SCOPE_SHORT: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote CC",
  FIELD_SERVICES: "Field Svc",
};

export function ScopeRegionBreakdown({ data }: Props) {
  // Transform flat data into grouped structure for recharts
  const scopes = [...new Set(data.map((d) => d.scope))];
  const regions = [...new Set(data.map((d) => d.region))];

  const chartData = scopes.map((scope) => {
    const row: Record<string, string | number> = { scope: SCOPE_SHORT[scope] ?? scope };
    for (const region of regions) {
      const match = data.find((d) => d.scope === scope && d.region === region);
      row[region] = match?.count ?? 0;
    }
    return row;
  });

  return (
    <div className="bg-white rounded-xl border border-[#e2e4f0] p-5">
      <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">
        Active Projects by Scope &amp; Region
      </p>
      {chartData.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e4f0" />
            <XAxis
              dataKey="scope"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
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
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {regions.map((region) => (
              <Bar
                key={region}
                dataKey={region}
                stackId="a"
                fill={REGION_COLORS[region] ?? "#6b7280"}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
