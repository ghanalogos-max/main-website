import { NextResponse } from "next/server";
import { accountSummary, getSessionAccount } from "@/lib/developer";
import { storeEnabled } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!storeEnabled) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "signed_out" }, { status: 401 });
  }
  return NextResponse.json(await accountSummary(account));
}
