import { ScopeOfWork } from "@/types/enums";

export type RateCardEntry = {
  serviceType: ScopeOfWork;
  roleName: string;
  hourlyRate: number;
  dailyRate: number;
  currency: string;
};

export const DEFAULT_RATE_CARD: RateCardEntry[] = [
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 55, dailyRate: 440, currency: "USD" },
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer", hourlyRate: 75, dailyRate: 600, currency: "USD" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Analyst", hourlyRate: 45, dailyRate: 360, currency: "USD" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Lead", hourlyRate: 65, dailyRate: 520, currency: "USD" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Operator", hourlyRate: 60, dailyRate: 480, currency: "USD" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Shift Supervisor", hourlyRate: 80, dailyRate: 640, currency: "USD" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Technician", hourlyRate: 70, dailyRate: 560, currency: "USD" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Engineer", hourlyRate: 90, dailyRate: 720, currency: "USD" },
];

export function estimateCost(
  scopeOfWork: ScopeOfWork,
  startDate: Date,
  endDate: Date
): { low: number; high: number; days: number; perDay: { low: number; high: number } } {
  const entries = DEFAULT_RATE_CARD.filter((r) => r.serviceType === scopeOfWork);
  if (!entries.length) return { low: 0, high: 0, days: 0, perDay: { low: 0, high: 0 } };

  const days = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const minRate = Math.min(...entries.map((e) => e.dailyRate));
  const maxRate = Math.max(...entries.map((e) => e.dailyRate));

  return {
    low: minRate * days,
    high: maxRate * days,
    days,
    perDay: { low: minRate, high: maxRate },
  };
}
