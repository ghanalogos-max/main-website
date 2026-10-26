import { NextRequest, NextResponse } from "next/server";
import { AuthError, type SignupPayload } from "@/lib/auth";
import { accountSummary, createAccount, startSession } from "@/lib/developer";
import { confirmVerification } from "@/lib/verification";
import { fail, unavailable } from "../../respond";

// Step 2 of email sign-up: confirm the email code (and SMS if enabled), create the account, sign in.
export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;

  try {
    const body = await req.json().catch(() => ({}));
    const { token, emailCode, phoneCode } = body;
    if (typeof token !== "string" || typeof emailCode !== "string") {
      throw new AuthError("Enter the email code.");
    }
    const payload = await confirmVerification<SignupPayload>(token, {
      email: emailCode,
      ...(typeof phoneCode === "string" ? { phone: phoneCode } : {}),
    });
    const now = Date.now();
    const account = await createAccount({
      name: payload.name,
      email: payload.email,
      ...(payload.phone ? { phone: payload.phone } : {}),
      passwordHash: payload.passwordHash,
      emailVerifiedAt: now,
      ...(payload.phoneVerified ? { phoneVerifiedAt: now } : {}),
    });
    startSession(account);
    return NextResponse.json(await accountSummary(account));
  } catch (err) {
    return fail(err);
  }
}
