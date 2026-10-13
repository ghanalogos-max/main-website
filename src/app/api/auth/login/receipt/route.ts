import { NextRequest, NextResponse } from "next/server";
import { AuthError, assertLoginAllowed, clientIp, recordLoginFailure } from "@/lib/auth";
import {
  accountForReference,
  accountSummary,
  applyApiPayment,
  startSession,
} from "@/lib/developer";
import { paystackEnabled, verifyTransaction } from "@/lib/paystack";
import { fail, unavailable } from "../../respond";

// Sign in with the email on the account plus the reference (receipt number)
// from any Paystack receipt for an API plan — for customers who forgot their
// password. A paid reference that was never applied is applied now.
export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    if (!email || !reference) throw new AuthError("Enter your email and receipt number.");

    const ip = clientIp(req);
    await assertLoginAllowed(email, ip);

    let account = await accountForReference(reference);
    if (!account && paystackEnabled) {
      account = await applyApiPayment(await verifyTransaction(reference)).catch(() => null);
    }
    if (!account || account.email !== email) {
      await recordLoginFailure(email, ip);
      throw new AuthError("We couldn't match that receipt number to this email.", 401);
    }
    startSession(account);
    return NextResponse.json(await accountSummary(account));
  } catch (err) {
    return fail(err);
  }
}
