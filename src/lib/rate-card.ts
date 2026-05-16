import { ScopeOfWork } from "@/types/enums";

export type RateCardEntry = {
  serviceType: ScopeOfWork;
  roleName: string;
  hourlyRate: number;
  dailyRate: number;
  currency: string;
  region: string;
};

// NA rates (USD)
const NA_RATES: RateCardEntry[] = [
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 55, dailyRate: 440, currency: "USD", region: "NA" },
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer", hourlyRate: 75, dailyRate: 600, currency: "USD", region: "NA" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Analyst", hourlyRate: 45, dailyRate: 360, currency: "USD", region: "NA" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Lead", hourlyRate: 65, dailyRate: 520, currency: "USD", region: "NA" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Operator", hourlyRate: 60, dailyRate: 480, currency: "USD", region: "NA" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Shift Supervisor", hourlyRate: 80, dailyRate: 640, currency: "USD", region: "NA" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Technician", hourlyRate: 70, dailyRate: 560, currency: "USD", region: "NA" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Engineer", hourlyRate: 90, dailyRate: 720, currency: "USD", region: "NA" },
];

// EMEA rates (EUR, ~15% higher than NA)
const EMEA_RATES: RateCardEntry[] = [
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 65, dailyRate: 520, currency: "EUR", region: "EMEA" },
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer", hourlyRate: 88, dailyRate: 700, currency: "EUR", region: "EMEA" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Analyst", hourlyRate: 52, dailyRate: 415, currency: "EUR", region: "EMEA" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Lead", hourlyRate: 75, dailyRate: 600, currency: "EUR", region: "EMEA" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Operator", hourlyRate: 70, dailyRate: 560, currency: "EUR", region: "EMEA" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Shift Supervisor", hourlyRate: 92, dailyRate: 740, currency: "EUR", region: "EMEA" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Technician", hourlyRate: 80, dailyRate: 640, currency: "EUR", region: "EMEA" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Engineer", hourlyRate: 105, dailyRate: 840, currency: "EUR", region: "EMEA" },
];

// LATAM rates (USD, ~30% lower than NA)
const LATAM_RATES: RateCardEntry[] = [
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 38, dailyRate: 305, currency: "USD", region: "LATAM" },
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer", hourlyRate: 52, dailyRate: 415, currency: "USD", region: "LATAM" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Analyst", hourlyRate: 32, dailyRate: 255, currency: "USD", region: "LATAM" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Lead", hourlyRate: 45, dailyRate: 360, currency: "USD", region: "LATAM" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Operator", hourlyRate: 42, dailyRate: 335, currency: "USD", region: "LATAM" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Shift Supervisor", hourlyRate: 56, dailyRate: 450, currency: "USD", region: "LATAM" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Technician", hourlyRate: 49, dailyRate: 390, currency: "USD", region: "LATAM" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Engineer", hourlyRate: 63, dailyRate: 505, currency: "USD", region: "LATAM" },
];

// ASPAC rates (USD, ~10% lower than NA)
const ASPAC_RATES: RateCardEntry[] = [
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Site Support Technician", hourlyRate: 50, dailyRate: 400, currency: "USD", region: "ASPAC" },
  { serviceType: "SITE_SUPPORT_SERVICES", roleName: "Senior Site Engineer", hourlyRate: 68, dailyRate: 545, currency: "USD", region: "ASPAC" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Analyst", hourlyRate: 41, dailyRate: 328, currency: "USD", region: "ASPAC" },
  { serviceType: "SERVICE_DESK", roleName: "Service Desk Lead", hourlyRate: 59, dailyRate: 472, currency: "USD", region: "ASPAC" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Operator", hourlyRate: 54, dailyRate: 432, currency: "USD", region: "ASPAC" },
  { serviceType: "REMOTE_COMMAND_CENTER", roleName: "RCC Shift Supervisor", hourlyRate: 72, dailyRate: 576, currency: "USD", region: "ASPAC" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Technician", hourlyRate: 63, dailyRate: 504, currency: "USD", region: "ASPAC" },
  { serviceType: "FIELD_SERVICES", roleName: "Field Services Engineer", hourlyRate: 81, dailyRate: 648, currency: "USD", region: "ASPAC" },
];

export const ALL_RATE_CARDS: RateCardEntry[] = [
  ...NA_RATES,
  ...EMEA_RATES,
  ...LATAM_RATES,
  ...ASPAC_RATES,
];

// Legacy default (NA) for backwards compatibility
export const DEFAULT_RATE_CARD: RateCardEntry[] = NA_RATES;

export function estimateCost(
  scopeOfWork: ScopeOfWork,
  startDate: Date,
  endDate: Date,
  region: string = "NA"
): { low: number; high: number; days: number; perDay: { low: number; high: number }; currency: string } {
  const entries = ALL_RATE_CARDS.filter(
    (r) => r.serviceType === scopeOfWork && r.region === region
  );
  // Fallback to NA if region not found
  const fallback = ALL_RATE_CARDS.filter((r) => r.serviceType === scopeOfWork && r.region === "NA");
  const source = entries.length > 0 ? entries : fallback;

  if (!source.length) return { low: 0, high: 0, days: 0, perDay: { low: 0, high: 0 }, currency: "USD" };

  const days = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const minRate = Math.min(...source.map((e) => e.dailyRate));
  const maxRate = Math.max(...source.map((e) => e.dailyRate));
  const currency = source[0].currency;

  return {
    low: minRate * days,
    high: maxRate * days,
    days,
    perDay: { low: minRate, high: maxRate },
    currency,
  };
}
