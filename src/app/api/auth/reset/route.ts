import { NextRequest, NextResponse } from "next/server";
import {
  AuthError,
  accountIdForResetToken,
  consumeResetToken,
  hashPassword,
  passwordProblem,
} from "@/lib/auth";
import { accountSummary, getAccount, saveAccount, startSession } from "@/lib/developer";
import { fail, unavailable } from "../respond";

// Sets a new password, signs out every other session, and signs in here.
export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;

  try {
    const { token, password } = await req.json().catch(() => ({}));
    if (typeof token !== "string" || !token) {
      throw new AuthError("This reset link is invalid. Request a new one.");
    }
    const problem = passwordProblem(password);
    if (problem) throw new AuthError(problem);

    const accountId = await accountIdForResetToken(token);
    const account = accountId ? await getAccount(accountId) : null;
    if (!account) {
      throw new AuthError("This reset link has expired or was already used. Request a new one.", 410);
    }

    await consumeResetToken(token);
    account.passwordHash = await hashPassword(password);
    account.emailVerifiedAt ??= Date.now();
    account.sessionVersion += 1;
    await saveAccount(account);
    startSession(account);
    return NextResponse.json(await accountSummary(account));
  } catch (err) {
    return fail(err);
  }
}
