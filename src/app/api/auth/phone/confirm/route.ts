import { NextRequest, NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { accountSummary, getSessionAccount, saveAccount } from "@/lib/developer";
import { confirmVerification } from "@/lib/verification";
import { fail, unavailable } from "../../respond";

export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;

  try {
    const account = await getSessionAccount();
    if (!account) throw new AuthError("Sign in first.", 401);
    const { token, code } = await req.json().catch(() => ({}));
    if (typeof token !== "string" || typeof code !== "string") {
      throw new AuthError("Enter the SMS code.");
    }

    const payload = await confirmVerification<{ accountId: string; phone: string }>(token, {
      phone: code,
    });
    if (payload.accountId !== account.id) throw new AuthError("This code belongs to another account.", 403);

    // Wallet network and name belong to the old number; confirm them again.
    if (account.phone !== payload.phone) delete account.payout;
    account.phone = payload.phone;
    account.phoneVerifiedAt = Date.now();
    await saveAccount(account);
    return NextResponse.json(await accountSummary(account));
  } catch (err) {
    return fail(err);
  }
}
