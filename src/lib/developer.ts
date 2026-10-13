import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { seal, unseal } from "./signing";
import { kv } from "./store";
import {
  API_PLANS,
  ApiPlan,
  ApiPlanId,
  BillingPeriod,
  PERIOD_DAYS,
  isBillingPeriod,
  isPaidApiPlan,
  planPriceGhs,
} from "./apiPlans";
import type { VerifiedTransaction } from "./paystack";
import { formatPhone } from "./verification";

export const API_PRODUCT = "ghanalogos-api";

export interface ApiKeyRecord {
  id: string;
  name: string;
  /** First characters of the key, safe to display. */
  prefix: string;
  hash: string;
  createdAt: number;
  /** Domain the key is registered to, e.g. "example.com" (subdomains included). */
  website?: string;
  allowLocalhost?: boolean;
}

/** Turns "https://www.Example.com/path" into "example.com"; null if not a public domain. */
export function normalizeWebsite(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
  if (!host.includes(".") || isIp || host.endsWith(".localhost") || host.length > 253) return null;
  return host;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Browser requests carry an Origin or Referer header; they must come from the
 * key's website (or localhost if allowed). Server-side requests have neither
 * and are allowed — the key itself is the secret there.
 */
export function keyAllowsOrigin(record: ApiKeyRecord, origin: string | null): boolean {
  if (!record.website || !origin) return true;
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (LOCAL_HOSTS.has(host) || host.endsWith(".localhost")) return Boolean(record.allowLocalhost);
  return host === record.website || host.endsWith(`.${record.website}`);
}

export interface Payment {
  reference: string;
  plan: ApiPlanId;
  period: BillingPeriod;
  amountGhs: number;
  paidAt: number;
}

export interface DevAccount {
  id: string;
  /** Lower-case; unique across accounts. */
  email: string;
  name: string;
  organisation?: string;
  /** International digits without "+", e.g. 233241234567. */
  phone?: string;
  emailVerifiedAt?: number;
  phoneVerifiedAt?: number;
  termsAcceptedAt: number;
  passwordHash?: string;
  githubId?: string;
  googleId?: string;
  /** Bumped on password reset to sign out every existing session. */
  sessionVersion: number;
  /** Last plan purchased; falls back to Sandbox once `expiresAt` passes. */
  plan: ApiPlanId;
  period?: BillingPeriod;
  expiresAt: number | null;
  createdAt: number;
  keys: ApiKeyRecord[];
  payments: Payment[];
}

export type Provider = "github" | "google";

const DAY = 24 * 60 * 60 * 1000;
const accountKey = (id: string) => `gl:acct:${id}`;
const emailKey = (email: string) => `gl:email:${email.toLowerCase()}`;
const providerKey = (provider: Provider, id: string) => `gl:${provider}:${id}`;
const apiKeyKey = (hash: string) => `gl:key:${hash}`;
const referenceKey = (ref: string) => `gl:ref:${ref}`;

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export function effectivePlan(account: DevAccount): ApiPlan {
  const active =
    account.plan !== "free" &&
    account.expiresAt !== null &&
    account.expiresAt > Date.now();
  return API_PLANS[active ? account.plan : "free"];
}

export async function getAccount(id: string): Promise<DevAccount | null> {
  return kv.get<DevAccount>(accountKey(id));
}

export async function saveAccount(account: DevAccount) {
  await kv.set(accountKey(account.id), account);
}

export async function accountForEmail(email: string): Promise<DevAccount | null> {
  const id = await kv.get<string>(emailKey(email));
  return id ? getAccount(id) : null;
}

export async function accountForProvider(
  provider: Provider,
  providerId: string
): Promise<DevAccount | null> {
  const id = await kv.get<string>(providerKey(provider, providerId));
  return id ? getAccount(id) : null;
}

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists. Sign in instead.");
  }
}

export async function createAccount(
  opts: Pick<DevAccount, "email" | "name"> &
    Partial<
      Pick<
        DevAccount,
        "organisation" | "phone" | "emailVerifiedAt" | "phoneVerifiedAt" | "passwordHash" | "githubId" | "googleId"
      >
    >
): Promise<DevAccount> {
  const now = Date.now();
  const account: DevAccount = {
    ...opts,
    id: `acct_${randomBytes(8).toString("hex")}`,
    email: opts.email.toLowerCase(),
    termsAcceptedAt: now,
    sessionVersion: 0,
    plan: "free",
    expiresAt: null,
    createdAt: now,
    keys: [],
    payments: [],
  };
  if (!(await kv.setIfAbsent(emailKey(account.email), account.id))) {
    throw new EmailTakenError();
  }
  if (account.githubId) await kv.set(providerKey("github", account.githubId), account.id);
  if (account.googleId) await kv.set(providerKey("google", account.googleId), account.id);
  await saveAccount(account);
  return account;
}

export async function linkProvider(
  account: DevAccount,
  provider: Provider,
  providerId: string
) {
  account[provider === "github" ? "githubId" : "googleId"] = providerId;
  account.emailVerifiedAt ??= Date.now();
  await kv.set(providerKey(provider, providerId), account.id);
  await saveAccount(account);
}

export async function createApiKey(
  account: DevAccount,
  opts: { name: string; website: unknown; allowLocalhost?: boolean }
): Promise<{ key: string; record: ApiKeyRecord }> {
  if (!account.phoneVerifiedAt) {
    throw new Error("Verify your phone number before creating API keys.");
  }
  const website = normalizeWebsite(opts.website);
  if (!website) {
    throw new Error("Enter the website this key is for, e.g. https://example.com.");
  }
  const plan = effectivePlan(account);
  if (account.keys.length >= plan.maxKeys) {
    throw new Error(
      `Your ${plan.name} plan allows ${plan.maxKeys} API key${plan.maxKeys === 1 ? "" : "s"}. Revoke one or upgrade.`
    );
  }
  const key = `gl_live_${randomBytes(24).toString("base64url")}`;
  const record: ApiKeyRecord = {
    id: `key_${randomBytes(6).toString("hex")}`,
    name: opts.name.trim().slice(0, 60) || website,
    prefix: key.slice(0, 14),
    hash: hashKey(key),
    createdAt: Date.now(),
    website,
    allowLocalhost: Boolean(opts.allowLocalhost),
  };
  account.keys.push(record);
  await kv.set(apiKeyKey(record.hash), account.id);
  await saveAccount(account);
  return { key, record };
}

export async function revokeApiKey(account: DevAccount, keyId: string) {
  const record = account.keys.find((k) => k.id === keyId);
  if (!record) throw new Error("Key not found.");
  account.keys = account.keys.filter((k) => k.id !== keyId);
  await kv.del(apiKeyKey(record.hash));
  await saveAccount(account);
}

export async function accountForKey(
  key: string
): Promise<{ account: DevAccount; record: ApiKeyRecord } | null> {
  if (!key.startsWith("gl_live_")) return null;
  const hash = hashKey(key);
  const id = await kv.get<string>(apiKeyKey(hash));
  const account = id ? await getAccount(id) : null;
  const record = account?.keys.find((k) => k.hash === hash);
  return account && record ? { account, record } : null;
}

/**
 * Applies a verified Paystack payment for an API plan to the account that
 * started the checkout. Safe to call more than once for the same reference.
 */
export async function applyApiPayment(
  tx: VerifiedTransaction
): Promise<DevAccount> {
  const existing = await accountForReference(tx.reference);
  if (existing) return existing;

  const { metadata } = tx;
  if (
    metadata.product !== API_PRODUCT ||
    !isPaidApiPlan(metadata.plan) ||
    !isBillingPeriod(metadata.period) ||
    typeof metadata.account !== "string"
  ) {
    throw new Error("This reference is not a GhanaLogos API payment.");
  }
  const plan = metadata.plan;
  const period = metadata.period;
  const amountGhs = planPriceGhs(plan, period);
  if (tx.amount < Math.round(amountGhs * 100)) {
    throw new Error("Payment amount does not match the selected plan.");
  }

  const account = await getAccount(metadata.account);
  if (!account) throw new Error("The account for this payment no longer exists.");

  if (!(await kv.setIfAbsent(referenceKey(tx.reference), account.id))) {
    return (await accountForReference(tx.reference)) ?? account;
  }

  const paidAt = new Date(tx.paid_at).getTime() || Date.now();
  const renewing =
    account.plan === plan && account.expiresAt !== null && account.expiresAt > paidAt;
  const start = renewing ? account.expiresAt! : paidAt;

  account.plan = plan;
  account.period = period;
  account.expiresAt = start + PERIOD_DAYS[period] * DAY;
  if (typeof metadata.organisation === "string" && !account.organisation) {
    account.organisation = metadata.organisation;
  }
  account.payments.push({ reference: tx.reference, plan, period, amountGhs, paidAt });
  await saveAccount(account);
  return account;
}

export async function accountForReference(
  reference: string
): Promise<DevAccount | null> {
  const id = await kv.get<string>(referenceKey(reference));
  return id ? getAccount(id) : null;
}

// Session: a signed cookie with the account id and session version.
const SESSION_COOKIE = "gl_dev";

interface Session {
  id: string;
  v: number;
  n: string;
}

export function startSession(account: DevAccount) {
  const session: Session = { id: account.id, v: account.sessionVersion, n: account.name };
  cookies().set(SESSION_COOKIE, seal(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

/** Cheap check for the header — doesn't touch storage. */
export function sessionName(): string | null {
  return unseal<Session>(cookies().get(SESSION_COOKIE)?.value)?.n ?? null;
}

export async function getSessionAccount(): Promise<DevAccount | null> {
  const session = unseal<Session>(cookies().get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const account = await getAccount(session.id);
  return account && account.sessionVersion === session.v ? account : null;
}

export function monthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function nextMonthStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

const usageKey = (id: string) => `gl:usage:${id}:${monthKey()}`;

export async function monthlyUsage(account: DevAccount): Promise<number> {
  return kv.count(usageKey(account.id));
}

export type MeterResult =
  | { ok: true; plan: ApiPlan; used: number }
  | { ok: false; reason: "rate_limited" | "quota_exceeded"; plan: ApiPlan; used: number; retryAfter: number };

/** Counts one request against the account's per-minute and monthly limits. */
export async function meterRequest(account: DevAccount): Promise<MeterResult> {
  const plan = effectivePlan(account);
  const minute = Math.floor(Date.now() / 60_000);
  const perMinute = await kv.incr(`gl:rl:${account.id}:${minute}`, 120);
  if (perMinute > plan.perMinute) {
    const used = await monthlyUsage(account);
    const retryAfter = 60 - (Math.floor(Date.now() / 1000) % 60);
    return { ok: false, reason: "rate_limited", plan, used, retryAfter };
  }

  const used = await kv.incr(usageKey(account.id), 40 * 24 * 60 * 60);
  if (used > plan.monthlyRequests) {
    const retryAfter = Math.ceil((nextMonthStart().getTime() - Date.now()) / 1000);
    return { ok: false, reason: "quota_exceeded", plan, used, retryAfter };
  }
  return { ok: true, plan, used };
}

/** What the dashboard is allowed to see — never hashes. */
export async function accountSummary(account: DevAccount) {
  const plan = effectivePlan(account);
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    organisation: account.organisation ?? null,
    phone: account.phone ? formatPhone(account.phone) : null,
    emailVerified: Boolean(account.emailVerifiedAt),
    phoneVerified: Boolean(account.phoneVerifiedAt),
    signInMethods: {
      password: Boolean(account.passwordHash),
      github: Boolean(account.githubId),
      google: Boolean(account.googleId),
    },
    plan: plan.id,
    purchasedPlan: account.plan,
    period: account.period ?? null,
    expiresAt: account.expiresAt,
    expired: account.plan !== "free" && plan.id === "free",
    limits: {
      monthlyRequests: plan.monthlyRequests,
      perMinute: plan.perMinute,
      maxKeys: plan.maxKeys,
    },
    usage: {
      month: monthKey(),
      used: await monthlyUsage(account),
      resetsAt: nextMonthStart().getTime(),
    },
    keys: account.keys.map(({ id, name, prefix, createdAt, website, allowLocalhost }) => ({
      id,
      name,
      prefix,
      createdAt,
      website: website ?? null,
      allowLocalhost: Boolean(allowLocalhost),
    })),
    payments: account.payments.map(({ reference, plan, period, amountGhs, paidAt }) => ({
      reference,
      plan,
      period,
      amountGhs,
      paidAt,
    })),
  };
}

export type AccountSummary = Awaited<ReturnType<typeof accountSummary>>;
