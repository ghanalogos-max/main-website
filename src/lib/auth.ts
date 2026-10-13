import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { kv } from "./store";
import { seal, unseal } from "./signing";
import type { Provider } from "./developer";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Held with the verification codes until email sign-up is confirmed. */
export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}

export class AuthError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Only same-site relative paths, to avoid open redirects. */
export function safeNext(value: unknown, fallback = "/developers/dashboard"): string {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    value.length <= 500
    ? value
    : fallback;
}

export function siteOrigin(req: NextRequest): string {
  if (process.env.NODE_ENV !== "production") return req.nextUrl.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
}

// Passwords: scrypt with a per-password salt, stored as "scrypt$salt$hash".
export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "Use at least 8 characters for your password.";
  }
  if (password.length > 200) return "That password is too long.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Use at least one letter and one number in your password.";
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  const [scheme, salt, hash] = (stored ?? "").split("$");
  if (scheme !== "scrypt" || !salt || !hash) {
    // Spend comparable time so missing accounts aren't detectable by timing.
    await scryptAsync(password, randomBytes(16), 64);
    return false;
  }
  const expected = Buffer.from(hash, "base64url");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64url"), expected.length);
  return timingSafeEqual(expected, actual);
}

/** Counts failed sign-in attempts per email and per IP over 15 minutes. */
export async function assertLoginAllowed(email: string, ip: string) {
  const window = Math.floor(Date.now() / 900_000);
  const [byEmail, byIp] = await Promise.all([
    kv.count(`gl:loginfail:e:${email}:${window}`),
    kv.count(`gl:loginfail:i:${ip}:${window}`),
  ]);
  if (byEmail >= 8 || byIp >= 30) {
    throw new AuthError("Too many failed attempts. Try again in 15 minutes, or reset your password.", 429);
  }
}

export async function recordLoginFailure(email: string, ip: string) {
  const window = Math.floor(Date.now() / 900_000);
  await Promise.all([
    kv.incr(`gl:loginfail:e:${email}:${window}`, 900),
    kv.incr(`gl:loginfail:i:${ip}:${window}`, 900),
  ]);
}

// Password reset tokens: random, stored hashed, valid for one hour, single use.
const resetKey = (token: string) =>
  `gl:reset:${createHash("sha256").update(token).digest("hex")}`;

export async function createResetToken(accountId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await kv.set(resetKey(token), accountId, 60 * 60);
  return token;
}

export async function accountIdForResetToken(token: string): Promise<string | null> {
  return kv.get<string>(resetKey(token));
}

export async function consumeResetToken(token: string) {
  await kv.del(resetKey(token));
}

// OAuth (GitHub, Google) — authorization code flow with a signed state cookie.
const OAUTH_COOKIE = "gl_oauth";

export const oauthProviders: Record<Provider, boolean> = {
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
};

export function isProvider(value: string): value is Provider {
  return value === "github" || value === "google";
}

const callbackUrl = (req: NextRequest, provider: Provider) =>
  `${siteOrigin(req)}/api/auth/${provider}/callback`;

export function oauthAuthorizeUrl(req: NextRequest, provider: Provider, next: string): string {
  const state = randomBytes(16).toString("base64url");
  cookies().set(OAUTH_COOKIE, seal({ state, provider, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  if (provider === "github") {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
    url.searchParams.set("redirect_uri", callbackUrl(req, provider));
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);
    return url.toString();
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", callbackUrl(req, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export interface OAuthProfile {
  providerId: string;
  email: string;
  name: string;
}

/** Validates the callback state and exchanges the code for a verified profile. */
export async function oauthProfile(
  req: NextRequest,
  provider: Provider
): Promise<{ profile: OAuthProfile; next: string }> {
  const saved = unseal<{ state: string; provider: string; next: string }>(
    cookies().get(OAUTH_COOKIE)?.value
  );
  cookies().delete(OAUTH_COOKIE);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!saved || saved.provider !== provider || !state || saved.state !== state || !code) {
    throw new AuthError("Sign-in expired or was cancelled. Please try again.");
  }
  const profile =
    provider === "github"
      ? await githubProfile(req, code)
      : await googleProfile(req, code);
  return { profile, next: safeNext(saved.next) };
}

async function githubProfile(req: NextRequest, code: string): Promise<OAuthProfile> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(req, "github"),
    }),
  });
  const { access_token } = await tokenRes.json();
  if (!access_token) throw new AuthError("GitHub sign-in failed. Please try again.");

  const headers = {
    Authorization: `Bearer ${access_token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "GhanaLogos",
  };
  const [user, emails] = await Promise.all([
    fetch("https://api.github.com/user", { headers }).then((r) => r.json()),
    fetch("https://api.github.com/user/emails", { headers }).then((r) => r.json()),
  ]);
  const primary = Array.isArray(emails)
    ? emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified) ??
      emails.find((e: { verified: boolean }) => e.verified)
    : null;
  if (!user?.id || !primary?.email) {
    throw new AuthError("Your GitHub account needs a verified email address.");
  }
  return {
    providerId: String(user.id),
    email: String(primary.email).toLowerCase(),
    name: user.name || user.login,
  };
}

async function googleProfile(req: NextRequest, code: string): Promise<OAuthProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl(req, "google"),
    }),
  });
  const { access_token } = await tokenRes.json();
  if (!access_token) throw new AuthError("Google sign-in failed. Please try again.");

  const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  }).then((r) => r.json());
  if (!info?.sub || !info.email || info.email_verified !== true) {
    throw new AuthError("Your Google account needs a verified email address.");
  }
  return {
    providerId: String(info.sub),
    email: String(info.email).toLowerCase(),
    name: info.name || info.email,
  };
}
