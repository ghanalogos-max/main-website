import { cookies, headers } from "next/headers";
import { seal, unseal } from "./signing";
import { FREE_DAILY_LIMIT, PlanId } from "./plans";
import { redis, redisEnabled } from "./store";

const QUOTA_COOKIE = "gl_quota";
const PREMIUM_COOKIE = "gl_premium";

interface QuotaToken {
  d: string;
  n: number;
}

export interface PremiumToken {
  email: string;
  plan: PlanId;
  exp: number;
  ref: string;
}

export interface QuotaStatus {
  premium: { plan: PlanId; expiresAt: number; email: string } | null;
  used: number;
  limit: number;
  /** null when premium (unlimited). */
  remaining: number | null;
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Ghana is on GMT all year, so the UTC date is also the local date.
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function endOfToday(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function getPremium(): PremiumToken | null {
  const token = unseal<PremiumToken>(cookies().get(PREMIUM_COOKIE)?.value);
  if (!token || token.exp < Date.now()) return null;
  return token;
}

export function setPremium(token: PremiumToken) {
  cookies().set(PREMIUM_COOKIE, seal(token), {
    ...cookieBase,
    expires: new Date(token.exp),
  });
}

export function clearPremium() {
  cookies().delete(PREMIUM_COOKIE);
}

function cookieCount(): number {
  const token = unseal<QuotaToken>(cookies().get(QUOTA_COOKIE)?.value);
  return token && token.d === today() ? token.n : 0;
}

// Optional per-IP counter (Upstash Redis REST) so clearing cookies doesn't
// reset the free quota. Without Redis the cookie alone is used.
function ipKey(): string | null {
  if (!redisEnabled) return null;
  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  return ip ? `gl:dl:${today()}:${ip}` : null;
}

async function ipCount(): Promise<number> {
  const key = ipKey();
  if (!key) return 0;
  try {
    const [value] = await redis([["GET", key]]);
    return Number(value) || 0;
  } catch {
    return 0;
  }
}

export async function getUsage(): Promise<number> {
  return Math.max(cookieCount(), await ipCount());
}

export async function recordDownload(): Promise<number> {
  let used = cookieCount() + 1;
  const key = ipKey();
  if (key) {
    try {
      const [value] = await redis([
        ["INCR", key],
        ["EXPIRE", key, 60 * 60 * 26],
      ]);
      used = Math.max(used, Number(value) || 0);
    } catch {
      // Fall back to the cookie count if Redis is unavailable.
    }
  }
  cookies().set(QUOTA_COOKIE, seal({ d: today(), n: used }), {
    ...cookieBase,
    expires: endOfToday(),
  });
  return used;
}

export async function getQuotaStatus(): Promise<QuotaStatus> {
  const premium = getPremium();
  const used = await getUsage();
  return {
    premium: premium
      ? { plan: premium.plan, expiresAt: premium.exp, email: premium.email }
      : null,
    used,
    limit: FREE_DAILY_LIMIT,
    remaining: premium ? null : Math.max(0, FREE_DAILY_LIMIT - used),
  };
}
