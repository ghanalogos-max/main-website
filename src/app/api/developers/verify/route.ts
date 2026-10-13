import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { applyApiPayment, startSession } from "@/lib/developer";

export const dynamic = "force-dynamic";

// Paystack redirects here after an API plan checkout with ?reference=...
export async function GET(req: NextRequest) {
  const reference =
    req.nextUrl.searchParams.get("reference") ||
    req.nextUrl.searchParams.get("trxref");
  const target = new URL("/developers/dashboard", req.nextUrl.origin);

  if (!reference) {
    target.searchParams.set("status", "error");
    return NextResponse.redirect(target);
  }

  try {
    const account = await applyApiPayment(await verifyTransaction(reference));
    startSession(account);
    target.searchParams.set("status", "success");
  } catch (err) {
    target.searchParams.set("status", "error");
    target.searchParams.set("message", (err as Error).message);
  }
  return NextResponse.redirect(target);
}
