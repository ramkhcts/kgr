"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const RAG_COLORS = { RED: "#dc2626", AMBER: "#d97706", GREEN: "#16a34a" };

export function RAGDistribution({ data }: { data: { status: string; count: number }[] }) {
  const chartData = data.map((d) => ({ name: d.status, value: d.count }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={RAG_COLORS[entry.name as keyof typeof RAG_COLORS] ?? "#6b7280"} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e4f0" }} />
        <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6b7280" }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
