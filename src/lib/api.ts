import { NextRequest, NextResponse } from "next/server";
import {
  accountForKey,
  keyAllowsOrigin,
  meterRequest,
  nextMonthStart,
  type DevAccount,
} from "./developer";
import { storeEnabled } from "./store";
import { absoluteUrl } from "./seo";
import type { ApiPlan } from "./apiPlans";
import type { Logo } from "./types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key",
  "Access-Control-Expose-Headers":
    "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Plan, Retry-After",
};

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  headers: Record<string, string> = {}
) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { ...CORS, ...headers } }
  );
}

export interface ApiContext {
  account: DevAccount;
  plan: ApiPlan;
  headers: Record<string, string>;
}

function readKey(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return (
    req.headers.get("x-api-key")?.trim() ||
    req.nextUrl.searchParams.get("api_key")?.trim() ||
    null
  );
}

function limitHeaders(plan: ApiPlan, used: number): Record<string, string> {
  return {
    "X-Plan": plan.id,
    "X-RateLimit-Limit": String(plan.monthlyRequests),
    "X-RateLimit-Remaining": String(Math.max(0, plan.monthlyRequests - used)),
    "X-RateLimit-Reset": String(Math.floor(nextMonthStart().getTime() / 1000)),
  };
}

/** Authenticates and meters a request. Returns a response on failure. */
export async function authenticate(
  req: NextRequest
): Promise<ApiContext | NextResponse> {
  if (!storeEnabled) {
    return apiError(503, "unavailable", "The GhanaLogos API is not available right now.");
  }
  const key = readKey(req);
  if (!key) {
    return apiError(
      401,
      "missing_api_key",
      "Send your API key in the Authorization header: `Authorization: Bearer gl_live_…`."
    );
  }
  const found = await accountForKey(key);
  if (!found) {
    return apiError(401, "invalid_api_key", "This API key is invalid or has been revoked.");
  }
  const { account, record } = found;
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!keyAllowsOrigin(record, origin)) {
    return apiError(
      403,
      "origin_not_allowed",
      `This API key is registered to ${record.website} and can't be used from this website. Create a key for this site in your dashboard.`
    );
  }

  const meter = await meterRequest(account);
  const headers = limitHeaders(meter.plan, meter.used);
  if (!meter.ok) {
    const retry = { ...headers, "Retry-After": String(meter.retryAfter) };
    return meter.reason === "rate_limited"
      ? apiError(
          429,
          "rate_limited",
          `Too many requests. Your ${meter.plan.name} plan allows ${meter.plan.perMinute} requests per minute.`,
          retry
        )
      : apiError(
          429,
          "quota_exceeded",
          `Monthly quota of ${meter.plan.monthlyRequests.toLocaleString("en")} requests reached. Upgrade at ${absoluteUrl("/developers")}.`,
          retry
        );
  }
  return { account, plan: meter.plan, headers };
}

export function apiJson(data: unknown, ctx: ApiContext, cache = "private, max-age=60") {
  return NextResponse.json(data, {
    headers: { ...CORS, ...ctx.headers, "Cache-Control": cache },
  });
}

export function apiBinary(body: ArrayBuffer, ctx: ApiContext, headers: Record<string, string>) {
  return new NextResponse(body, { headers: { ...CORS, ...ctx.headers, ...headers } });
}

export function serializeLogo(logo: Logo) {
  return {
    name: logo.name,
    slug: logo.slug,
    categories: logo.categories ?? [],
    format: logo.format,
    width: logo.width ?? null,
    height: logo.height ?? null,
    brand_color: logo.brandColor ?? null,
    website: logo.website ?? null,
    description: logo.description ?? null,
    featured: Boolean(logo.featured),
    files: {
      original: absoluteUrl(logo.imageUrl),
      download: absoluteUrl(`/api/v1/logos/${logo.slug}/download`),
    },
    page_url: absoluteUrl(`/logo/${logo.slug}`),
    source: {
      url: logo.sourceUrl ?? null,
      license: logo.license ?? null,
      wikipedia: logo.wikipediaUrl ?? null,
    },
  };
}
