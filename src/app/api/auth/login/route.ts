import { NextRequest, NextResponse } from "next/server";
import {
  AuthError,
  assertLoginAllowed,
  clientIp,
  recordLoginFailure,
  verifyPassword,
} from "@/lib/auth";
import { accountForEmail, accountSummary, startSession } from "@/lib/developer";
import { fail, unavailable } from "../respond";

export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) throw new AuthError("Enter your email and password.");

    const ip = clientIp(req);
    await assertLoginAllowed(email, ip);

    const account = await accountForEmail(email);
    if (!(await verifyPassword(password, account?.passwordHash)) || !account) {
      await recordLoginFailure(email, ip);
      throw new AuthError("Incorrect email or password.", 401);
    }
    startSession(account);
    return NextResponse.json(await accountSummary(account));
  } catch (err) {
    return fail(err);
  }
}
