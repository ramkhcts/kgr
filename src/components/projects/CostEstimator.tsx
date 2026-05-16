"use client";
import { useMemo } from "react";
import { estimateCost } from "@/lib/rate-card";
import { ScopeOfWork } from "@/types/enums";
import { TrendingUp } from "lucide-react";

interface CostEstimatorProps {
  scopeOfWork: string;
  startDate: string;
  endDate: string;
}

export function CostEstimator({ scopeOfWork, startDate, endDate }: CostEstimatorProps) {
  const estimate = useMemo(() => {
    if (!scopeOfWork || !startDate || !endDate) return null;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
      return estimateCost(scopeOfWork as ScopeOfWork, start, end);
    } catch {
      return null;
    }
  }, [scopeOfWork, startDate, endDate]);

  if (!estimate || estimate.low === 0) return null;

  return (
    <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, #1a1f5e10 0%, #3d2d8e10 100%)", border: "1px solid #1a1f5e20" }}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-[#1a1f5e]" />
        <p className="text-sm font-700 text-[#1a1f5e]">Live Cost Estimate (MSA Rate Card)</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Duration</p>
          <p className="text-lg font-800 text-[#1a1f5e]">{estimate.days}</p>
          <p className="text-[10px] text-gray-500">days</p>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Estimate (Low)</p>
          <p className="text-lg font-800 text-[#16a34a]">${estimate.low.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">USD</p>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Estimate (High)</p>
          <p className="text-lg font-800 text-[#d97706]">${estimate.high.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">USD</p>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Based on {scopeOfWork.replace(/_/g, " ")} rates · ${estimate.perDay.low}–${estimate.perDay.high}/day
      </p>
    </div>
  );
}
