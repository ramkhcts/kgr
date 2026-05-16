import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { RateCardRegionTabs } from "./RateCardRegionTabs";
import { RateCardEditor } from "./RateCardEditor";
import type { RateCardRow } from "./RateCardRegionTabs";

export default async function RateCardPage() {
  const user = await requireAuth();

  const entries = await prisma.rateCard.findMany({
    where: { isActive: true },
    orderBy: [{ region: "asc" }, { serviceType: "asc" }, { hourlyRate: "asc" }],
  });

  // Group by region → scope
  const byRegion: Record<string, Record<string, RateCardRow[]>> = {};
  for (const e of entries) {
    const region = e.region ?? "NA";
    if (!byRegion[region]) byRegion[region] = {};
    if (!byRegion[region][e.serviceType]) byRegion[region][e.serviceType] = [];
    byRegion[region][e.serviceType].push(e as RateCardRow);
  }

  const canEdit = ["PMO_LEAD", "SUPER_ADMIN"].includes(user.role);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-800 text-[#1a1f5e]">Global Rate Card</h1>
        <p className="text-sm text-gray-500">
          Pre-agreed rates per MSA between KGR End User Services and KarthikLLC — all regions
        </p>
      </div>

      {/* View (all roles) */}
      <RateCardRegionTabs byRegion={byRegion} />

      {/* Editor (PMO_LEAD / SUPER_ADMIN only) */}
      {canEdit && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 border-t border-[#e2e4f0]" />
            <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-widest whitespace-nowrap">
              PMO Admin — Rate Management
            </p>
            <div className="flex-1 border-t border-[#e2e4f0]" />
          </div>
          <RateCardEditor byRegion={byRegion} />
        </div>
      )}
    </div>
  );
}
