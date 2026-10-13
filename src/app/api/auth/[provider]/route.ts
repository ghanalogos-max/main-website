import { NextRequest, NextResponse } from "next/server";
import { isProvider, oauthAuthorizeUrl, oauthProviders, safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Starts "Continue with GitHub / Google".
export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const login = new URL("/login", req.nextUrl.origin);
  if (!isProvider(params.provider) || !oauthProviders[params.provider]) {
    login.searchParams.set("error", "That sign-in option isn't available.");
    return NextResponse.redirect(login);
  }
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  return NextResponse.redirect(oauthAuthorizeUrl(req, params.provider, next));
}
