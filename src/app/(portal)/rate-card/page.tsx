import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { SCOPE_LABELS, REGION_LABELS } from "@/types/enums";
import { RateCardRegionTabs } from "./RateCardRegionTabs";

export default async function RateCardPage() {
  await requireAuth();

  const entries = await prisma.rateCard.findMany({
    where: { isActive: true },
    orderBy: [{ region: "asc" }, { serviceType: "asc" }, { hourlyRate: "asc" }],
  });

  // Group by region, then by scope
  const byRegion: Record<string, Record<string, typeof entries>> = {};
  for (const e of entries) {
    const region = e.region ?? "NA";
    if (!byRegion[region]) byRegion[region] = {};
    if (!byRegion[region][e.serviceType]) byRegion[region][e.serviceType] = [];
    byRegion[region][e.serviceType].push(e);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-800 text-[#1a1f5e]">Global Rate Card</h1>
        <p className="text-sm text-gray-500">Pre-agreed rates per MSA between KGR End User Services and KarthikLLC — all regions</p>
      </div>

      <RateCardRegionTabs byRegion={byRegion} />
    </div>
  );
}
