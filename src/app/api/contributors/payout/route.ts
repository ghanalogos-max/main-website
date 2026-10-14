import { NextResponse } from "next/server";
import { getSessionAccount, saveAccount } from "@/lib/developer";
import { isMomoNetwork } from "@/lib/contributors";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  if (!account.phone || !account.phoneVerifiedAt) {
    return NextResponse.json(
      { error: "Verify your phone number first. Payouts are only sent to your verified number." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const accountName =
    typeof body.accountName === "string" ? body.accountName.trim().slice(0, 100) : "";

  if (!isMomoNetwork(body.network)) {
    return NextResponse.json({ error: "Choose your Mobile Money network." }, { status: 400 });
  }
  if (accountName.length < 2) {
    return NextResponse.json(
      { error: "Enter the name registered on the Mobile Money wallet." },
      { status: 400 }
    );
  }

  account.payout = { network: body.network, accountName, updatedAt: Date.now() };
  await saveAccount(account);
  return NextResponse.json({ ok: true });
}
