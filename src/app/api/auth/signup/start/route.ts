import { NextRequest, NextResponse } from "next/server";
import {
  AuthError,
  EMAIL,
  SignupPayload,
  clientIp,
  hashPassword,
  passwordProblem,
} from "@/lib/auth";
import { accountForEmail } from "@/lib/developer";
import { emailVerificationAvailable, signupSmsEnabled } from "@/lib/notify";
import { PHONE_HINT, formatPhone, normalizePhone, startVerification } from "@/lib/verification";
import { fail, unavailable } from "../../respond";

// Step 1 of email sign-up: validate details and send an email code
// (and optionally an SMS code when ENABLE_SIGNUP_SMS=1).
export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;
  if (!emailVerificationAvailable) {
    return NextResponse.json(
      { error: "Sign-up isn't available yet. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    if (!name) throw new AuthError("Enter your name.");
    if (!EMAIL.test(email)) throw new AuthError("Enter a valid email.");
    if (rawPhone && !phone) throw new AuthError(PHONE_HINT);
    if (signupSmsEnabled && !phone) throw new AuthError(PHONE_HINT);
    const problem = passwordProblem(body.password);
    if (problem) throw new AuthError(problem);
    if (body.acceptTerms !== true) {
      throw new AuthError("Please accept the Terms and Privacy Policy to continue.");
    }
    if (await accountForEmail(email)) {
      throw new AuthError("An account with this email already exists. Sign in or reset your password.", 409);
    }

    const payload: SignupPayload = {
      name,
      email,
      ...(phone ? { phone } : {}),
      passwordHash: await hashPassword(body.password),
      phoneVerified: Boolean(signupSmsEnabled && phone),
    };
    const { token, devCodes } = await startVerification({
      payload,
      name,
      email,
      phone: signupSmsEnabled && phone ? phone : undefined,
      ip: clientIp(req),
    });
    return NextResponse.json({
      token,
      email,
      phone: phone ? formatPhone(phone) : null,
      sms: Boolean(signupSmsEnabled && phone),
      devCodes,
    });
  } catch (err) {
    return fail(err);
  }
}
