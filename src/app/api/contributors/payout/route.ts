import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, saveAccount } from "@/lib/developer";
import { isMomoNetwork } from "@/lib/contributors";
import { normalizePhone } from "@/lib/verification";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const number = typeof body.number === "string" ? normalizePhone(body.number) : null;
  const accountName = typeof body.accountName === "string" ? body.accountName.trim().slice(0, 100) : "";

  if (!isMomoNetwork(body.network)) {
    return NextResponse.json({ error: "Choose your Mobile Money network." }, { status: 400 });
  }
  if (!number || !number.startsWith("233")) {
    return NextResponse.json(
      { error: "Enter a Ghana Mobile Money number, e.g. 024 123 4567." },
      { status: 400 }
    );
  }
  if (accountName.length < 2) {
    return NextResponse.json(
      { error: "Enter the name registered on the Mobile Money wallet." },
      { status: 400 }
    );
  }

  account.payout = { network: body.network, number, accountName, updatedAt: Date.now() };
  await saveAccount(account);
  return NextResponse.json({ ok: true });
}
