import { NextRequest, NextResponse } from "next/server";
import { premiumFromReference } from "@/lib/paystack";
import { setPremium } from "@/lib/quota";

export const dynamic = "force-dynamic";

// Paystack redirects here after checkout with ?reference=...
export async function GET(req: NextRequest) {
  const reference =
    req.nextUrl.searchParams.get("reference") ||
    req.nextUrl.searchParams.get("trxref");
  const target = new URL("/premium", req.nextUrl.origin);

  if (!reference) {
    target.searchParams.set("status", "error");
    return NextResponse.redirect(target);
  }

  try {
    setPremium(await premiumFromReference(reference));
    target.searchParams.set("status", "success");
  } catch (err) {
    target.searchParams.set("status", "error");
    target.searchParams.set("message", (err as Error).message);
  }
  return NextResponse.redirect(target);
}
