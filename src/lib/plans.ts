export const FREE_DAILY_LIMIT = 5;

export type PlanId = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  priceGhs: number;
  days: number;
  blurb: string;
}

export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: "monthly",
    name: "Premium Monthly",
    priceGhs: Number(process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_GHS || 50),
    days: 30,
    blurb: "Perfect for a single project or campaign.",
  },
  yearly: {
    id: "yearly",
    name: "Premium Yearly",
    priceGhs: Number(process.env.NEXT_PUBLIC_PREMIUM_YEARLY_GHS || 400),
    days: 365,
    blurb: "Best value for agencies, designers and newsrooms.",
  },
};

export const PNG_SIZES = [512, 1024, 2048, 4096] as const;
export const PREMIUM_ONLY_SIZES: readonly number[] = [4096];

export function isPlanId(value: unknown): value is PlanId {
  return value === "monthly" || value === "yearly";
}
