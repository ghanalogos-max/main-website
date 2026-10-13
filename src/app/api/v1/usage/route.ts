import { NextRequest } from "next/server";
import { apiJson, authenticate, preflight } from "@/lib/api";
import { monthlyUsage, monthKey, nextMonthStart } from "@/lib/developer";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export async function GET(req: NextRequest) {
  const ctx = await authenticate(req);
  if (!("account" in ctx)) return ctx;

  const used = await monthlyUsage(ctx.account);
  return apiJson(
    {
      data: {
        plan: ctx.plan.id,
        month: monthKey(),
        requests_used: used,
        requests_limit: ctx.plan.monthlyRequests,
        per_minute_limit: ctx.plan.perMinute,
        resets_at: nextMonthStart().toISOString(),
        plan_expires_at: ctx.account.expiresAt
          ? new Date(ctx.account.expiresAt).toISOString()
          : null,
      },
    },
    ctx,
    "no-store"
  );
}
