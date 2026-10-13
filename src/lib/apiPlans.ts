export type ApiPlanId = "free" | "individual" | "team" | "organisation";
export type BillingPeriod = "monthly" | "yearly";

export interface ApiPlan {
  id: ApiPlanId;
  name: string;
  audience: string;
  blurb: string;
  monthlyGhs: number;
  /** Requests per calendar month (UTC). */
  monthlyRequests: number;
  /** Requests per minute, per account. */
  perMinute: number;
  maxKeys: number;
  commercial: boolean;
  support: string;
  features: string[];
}

const price = (env: string | undefined, fallback: number) =>
  Number(env || fallback);

export const API_PLANS: Record<ApiPlanId, ApiPlan> = {
  free: {
    id: "free",
    name: "Sandbox",
    audience: "Try it out",
    blurb: "Explore the API and prototype personal projects.",
    monthlyGhs: 0,
    monthlyRequests: 1_000,
    perMinute: 30,
    maxKeys: 1,
    commercial: false,
    support: "Community support",
    features: ["All endpoints", "Personal & non-commercial use"],
  },
  individual: {
    id: "individual",
    name: "Individual",
    audience: "Freelancers & solo developers",
    blurb: "Ship a commercial app or client project on your own.",
    monthlyGhs: price(process.env.NEXT_PUBLIC_API_INDIVIDUAL_GHS, 99),
    monthlyRequests: 25_000,
    perMinute: 120,
    maxKeys: 3,
    commercial: true,
    support: "Email support",
    features: ["All endpoints", "Commercial use", "Usage dashboard"],
  },
  team: {
    id: "team",
    name: "Team",
    audience: "Startups & agencies",
    blurb: "Separate keys for every project, environment and teammate.",
    monthlyGhs: price(process.env.NEXT_PUBLIC_API_TEAM_GHS, 399),
    monthlyRequests: 150_000,
    perMinute: 300,
    maxKeys: 10,
    commercial: true,
    support: "Priority email support",
    features: [
      "All endpoints",
      "Commercial use",
      "Usage dashboard",
      "Logo requests within 5 working days",
    ],
  },
  organisation: {
    id: "organisation",
    name: "Organisation",
    audience: "Banks, media houses & enterprises",
    blurb: "High-volume access with dedicated support and invoicing.",
    monthlyGhs: price(process.env.NEXT_PUBLIC_API_ORGANISATION_GHS, 1199),
    monthlyRequests: 1_000_000,
    perMinute: 1_000,
    maxKeys: 50,
    commercial: true,
    support: "Dedicated support line",
    features: [
      "All endpoints",
      "Commercial use",
      "Usage dashboard",
      "Logo requests within 2 working days",
      "Invoices for procurement",
    ],
  },
};

export const PAID_API_PLANS: ApiPlanId[] = ["individual", "team", "organisation"];

export const PERIOD_DAYS: Record<BillingPeriod, number> = {
  monthly: 30,
  yearly: 365,
};

/** Yearly billing is charged as ten months — two months free. */
export function planPriceGhs(plan: ApiPlanId, period: BillingPeriod): number {
  const monthly = API_PLANS[plan].monthlyGhs;
  return period === "yearly" ? monthly * 10 : monthly;
}

export function isPaidApiPlan(value: unknown): value is ApiPlanId {
  return PAID_API_PLANS.includes(value as ApiPlanId);
}

export function isBillingPeriod(value: unknown): value is BillingPeriod {
  return value === "monthly" || value === "yearly";
}
