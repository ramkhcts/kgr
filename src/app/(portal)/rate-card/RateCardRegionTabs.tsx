"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SCOPE_LABELS, REGION_LABELS } from "@/types/enums";

export type RateCardRow = {
  id: string;
  serviceType: string;
  roleName: string;
  hourlyRate: number;
  dailyRate: number;
  currency: string;
  region: string | null;
};

/** 22 standard working days per month */
export const WORKING_DAYS = 22;

const REGION_ORDER = ["NA", "EMEA", "LATAM", "ASPAC"];

export function RateCardRegionTabs({
  byRegion,
}: {
  byRegion: Record<string, Record<string, RateCardRow[]>>;
}) {
  const regions = REGION_ORDER.filter((r) => byRegion[r]);
  const [activeRegion, setActiveRegion] = useState(regions[0] ?? "NA");

  const grouped        = byRegion[activeRegion] ?? {};
  const sampleCurrency = Object.values(grouped)[0]?.[0]?.currency ?? "USD";
  const currencySymbol = sampleCurrency === "EUR" ? "€" : "$";

  return (
    <div>
      {/* Region tabs */}
      <div className="flex gap-1 mb-4 bg-[#f4f5fb] p-1 rounded-xl w-fit">
        {regions.map((region) => (
          <button
            key={region}
            onClick={() => setActiveRegion(region)}
            className={`px-4 py-2 rounded-lg text-sm font-600 transition-all ${
              activeRegion === region
                ? "bg-[#1a1f5e] text-white shadow-sm"
                : "text-gray-500 hover:text-[#1a1f5e] hover:bg-white/60"
            }`}
          >
            {REGION_LABELS[region] ?? region}
          </button>
        ))}
      </div>

      {/* Currency note */}
      <p className="text-xs text-gray-400 mb-3">
        Currency:{" "}
        <span className="font-600 text-gray-600">{sampleCurrency}</span>
        {" · "}Monthly rate based on {WORKING_DAYS} working days · MSA rates for{" "}
        {REGION_LABELS[activeRegion] ?? activeRegion}
      </p>

      {/* Tables by scope */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([scope, rows]) => (
          <Card key={scope} padding={false}>
            <div
              className="px-5 py-3 border-b border-[#e2e4f0]"
              style={{ background: "linear-gradient(135deg, #1a1f5e08, #3d2d8e08)" }}
            >
              <p className="text-sm font-700 text-[#1a1f5e]">
                {SCOPE_LABELS[scope as keyof typeof SCOPE_LABELS] ?? scope}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#f4f5fb]">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
                    Hourly
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
                    Monthly <span className="text-[10px] font-400 text-gray-400">({WORKING_DAYS}d)</span>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
                    Currency
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const monthly = r.dailyRate * WORKING_DAYS;
                  return (
                    <tr
                      key={r.id}
                      className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}
                    >
                      <td className="px-5 py-3 font-500 text-gray-800">{r.roleName}</td>
                      <td className="px-5 py-3 text-right font-600 text-[#1a1f5e]">
                        {currencySymbol}{r.hourlyRate.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-700 text-[#16a34a]">
                        {currencySymbol}{monthly.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500 text-xs">{r.currency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}
