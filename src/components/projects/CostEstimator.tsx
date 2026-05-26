"use client";
import { useMemo } from "react";
import { estimateCost } from "@/lib/rate-card";
import { ScopeOfWork } from "@/types/enums";
import { TrendingUp } from "lucide-react";

interface CostEstimatorProps {
  scopeOfWork: string;
  startDate: string;
  endDate: string;
  region?: string;
  numberOfFtes?: number;
}

export function CostEstimator({ scopeOfWork, startDate, endDate, region = "NA", numberOfFtes }: CostEstimatorProps) {
  const estimate = useMemo(() => {
    if (!scopeOfWork || !startDate || !endDate) return null;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
      return estimateCost(scopeOfWork as ScopeOfWork, start, end, region);
    } catch {
      return null;
    }
  }, [scopeOfWork, startDate, endDate, region]);

  if (!estimate || estimate.low === 0) return null;

  const currencySymbol = estimate.currency === "EUR" ? "€" : "$";
  const ftes = numberOfFtes && numberOfFtes > 1 ? numberOfFtes : null;

  // Derive monthly figures: assume 22 working days per month
  const WORK_DAYS_PER_MONTH = 22;
  const perFteMonthlyLow  = Math.round(estimate.perDay.low  * WORK_DAYS_PER_MONTH);
  const perFteMonthlyHigh = Math.round(estimate.perDay.high * WORK_DAYS_PER_MONTH);

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
          <p className="text-lg font-800 text-[#16a34a]">{currencySymbol}{estimate.low.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">{estimate.currency}</p>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Estimate (High)</p>
          <p className="text-lg font-800 text-[#d97706]">{currencySymbol}{estimate.high.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">{estimate.currency}</p>
        </div>
      </div>
      {ftes ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-white/60 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Per FTE / month</p>
            <p className="text-sm font-700 text-[#1a1f5e]">
              {currencySymbol}{perFteMonthlyLow.toLocaleString()} – {currencySymbol}{perFteMonthlyHigh.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Total Team ({ftes} FTEs) / month</p>
            <p className="text-sm font-700 text-[#1a1f5e]">
              {currencySymbol}{(perFteMonthlyLow * ftes).toLocaleString()} – {currencySymbol}{(perFteMonthlyHigh * ftes).toLocaleString()}
            </p>
          </div>
        </div>
      ) : null}
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Based on {scopeOfWork.replace(/_/g, " ")} rates · {currencySymbol}{estimate.perDay.low}–{currencySymbol}{estimate.perDay.high}/day · {region}
      </p>
    </div>
  );
}
