import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken, safeNext, siteOrigin } from "@/lib/auth";
import { getAccount, startSession } from "@/lib/developer";
import { unavailable } from "../../../respond";

export async function GET(req: NextRequest) {
  const down = unavailable();
  if (down) return down;

  const token = req.nextUrl.searchParams.get("token") ?? "";
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const origin = siteOrigin(req);

  const fail = (message: string) =>
    NextResponse.redirect(
      `${origin}/login?method=magic&error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`
    );

  if (!token) return fail("That sign-in link is missing or incomplete.");

  const accountId = await consumeMagicToken(token);
  if (!accountId) return fail("That sign-in link has expired. Request a new one.");

  const account = await getAccount(accountId);
  if (!account) return fail("That account no longer exists.");

  startSession(account);
  return NextResponse.redirect(`${origin}${next}`);
}
