import { NextRequest, NextResponse } from "next/server";
import { AuthError, type SignupPayload } from "@/lib/auth";
import { accountSummary, createAccount, startSession } from "@/lib/developer";
import { confirmVerification } from "@/lib/verification";
import { fail, unavailable } from "../../respond";

// Step 2 of email sign-up: confirm both codes, create the account, sign in.
export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;

  try {
    const { token, emailCode, phoneCode } = await req.json().catch(() => ({}));
    if (typeof token !== "string" || typeof emailCode !== "string" || typeof phoneCode !== "string") {
      throw new AuthError("Enter both codes.");
    }
    const payload = await confirmVerification<SignupPayload>(token, {
      email: emailCode,
      phone: phoneCode,
    });
    const now = Date.now();
    const account = await createAccount({
      ...payload,
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
    });
    startSession(account);
    return NextResponse.json(await accountSummary(account));
  } catch (err) {
    return fail(err);
  }
}
