import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { SCOPE_LABELS } from "@/types/enums";

export default async function RateCardPage() {
  await requireAuth();

  const entries = await prisma.rateCard.findMany({
    where: { isActive: true },
    orderBy: [{ serviceType: "asc" }, { hourlyRate: "asc" }],
  });

  const grouped = entries.reduce((acc, e) => {
    const key = e.serviceType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {} as Record<string, typeof entries>);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-800 text-[#1a1f5e]">Global Rate Card</h1>
        <p className="text-sm text-gray-500">Pre-agreed rates per MSA between KGR End User Services and KarthikLLC</p>
      </div>

      {Object.entries(grouped).map(([scope, rows]) => (
        <Card key={scope} padding={false}>
          <div className="px-5 py-3 border-b border-[#e2e4f0]" style={{ background: "linear-gradient(135deg, #1a1f5e08, #3d2d8e08)" }}>
            <p className="text-sm font-700 text-[#1a1f5e]">
              {SCOPE_LABELS[scope as keyof typeof SCOPE_LABELS] ?? scope}
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-[#f4f5fb]">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Role</th>
                <th className="text-right px-5 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Hourly Rate</th>
                <th className="text-right px-5 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Daily Rate</th>
                <th className="text-right px-5 py-2.5 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Currency</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                  <td className="px-5 py-3 font-500 text-gray-800">{r.roleName}</td>
                  <td className="px-5 py-3 text-right font-600 text-[#1a1f5e]">${r.hourlyRate.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-700 text-[#16a34a]">${r.dailyRate.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-gray-500 text-xs">{r.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
