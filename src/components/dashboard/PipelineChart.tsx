"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/workflow";
import { ProjectStatus } from "@/types/enums";

export function PipelineChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 60 }}>
        <XAxis
          dataKey="status"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          angle={-40}
          textAnchor="end"
          tickFormatter={(s) => STATUS_LABELS[s as ProjectStatus] ?? s}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6b7280" }} />
        <Tooltip
          formatter={(v, _, p) => [v, STATUS_LABELS[p.payload.status as ProjectStatus] ?? p.payload.status]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e4f0" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status as ProjectStatus] ?? "#6b7280"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
