"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  data: { stage: string; avgDays: number }[];
}

const STAGE_SHORT: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  INFO_REQUIRED: "Info Req.",
  SOLUTIONING: "Solutioning",
  SOW_DRAFT: "SOW Draft",
  SOW_APPROVAL: "SOW Approval",
  SOW_SIGNED: "SOW Signed",
  PO_REQUESTED: "PO Req.",
  PO_RECEIVED: "PO Recv.",
  RESOURCE_ASSIGNED: "Resource Asgn.",
  HANDED_TO_OPERATIONS: "Ops",
};

export function AvgStageTime({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    stageLabel: STAGE_SHORT[d.stage] ?? d.stage,
  }));

  return (
    <div className="bg-white rounded-xl border border-[#e2e4f0] p-5">
      <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">
        Avg. Days Per Stage (last 30 days)
      </p>
      {chartData.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 4, right: 16, bottom: 0, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e4f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              unit=" d"
            />
            <YAxis
              type="category"
              dataKey="stageLabel"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e4f0" }}
              formatter={(value) => [`${(value as number).toFixed(1)} days`, "Avg. Stage Time"]}
            />
            <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index % 2 === 0 ? "#1a1f5e" : "#3d2d8e"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
