import { NextRequest, NextResponse } from "next/server";
import { AuthError, isProvider, oauthProfile, oauthProviders } from "@/lib/auth";
import {
  accountForEmail,
  accountForProvider,
  createAccount,
  linkProvider,
  startSession,
} from "@/lib/developer";
import { storeEnabled } from "@/lib/store";

export const dynamic = "force-dynamic";

// Finds the account for this GitHub/Google identity, links it to an existing
// account with the same verified email, or creates a new account.
export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const login = new URL("/login", req.nextUrl.origin);
  const provider = params.provider;
  if (!storeEnabled) {
    login.searchParams.set("error", "Accounts aren't available yet. Please try again later.");
    return NextResponse.redirect(login);
  }
  if (!isProvider(provider) || !oauthProviders[provider]) {
    login.searchParams.set("error", "That sign-in option isn't available.");
    return NextResponse.redirect(login);
  }

  try {
    const { profile, next } = await oauthProfile(req, provider);
    let account = await accountForProvider(provider, profile.providerId);
    if (!account) {
      account = await accountForEmail(profile.email);
      if (account) {
        await linkProvider(account, provider, profile.providerId);
      } else {
        account = await createAccount({
          email: profile.email,
          name: profile.name.slice(0, 80),
          emailVerifiedAt: Date.now(),
          [provider === "github" ? "githubId" : "googleId"]: profile.providerId,
        });
      }
    }
    startSession(account);
    return NextResponse.redirect(new URL(next, req.nextUrl.origin));
  } catch (err) {
    if (!(err instanceof AuthError)) console.error(err);
    login.searchParams.set(
      "error",
      err instanceof AuthError ? err.message : "Sign-in failed. Please try again."
    );
    return NextResponse.redirect(login);
  }
}
