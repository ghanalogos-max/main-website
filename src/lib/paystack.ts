import { PLANS, PlanId, isPlanId } from "./plans";
import type { PremiumToken } from "./quota";

const API = "https://api.paystack.co";

export const paystackEnabled = Boolean(process.env.PAYSTACK_SECRET_KEY);

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok || !body.status) {
    throw new Error(body.message || `Paystack error ${res.status}`);
  }
  return body.data as T;
}

export async function initializeTransaction(opts: {
  email: string;
  amountGhs: number;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<{ authorization_url: string; reference: string }> {
  return paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: opts.email,
      amount: Math.round(opts.amountGhs * 100),
      currency: "GHS",
      callback_url: opts.callbackUrl,
      metadata: opts.metadata,
    }),
  });
}

export interface VerifiedTransaction {
  status: string;
  reference: string;
  /** In pesewas. */
  amount: number;
  currency: string;
  paid_at: string;
  customer: { email: string };
  metadata: Record<string, unknown>;
}

/** Fetches a transaction and throws unless it was paid in GHS. */
export async function verifyTransaction(
  reference: string
): Promise<VerifiedTransaction> {
  const tx = await paystack<
    Omit<VerifiedTransaction, "metadata"> & { metadata?: unknown }
  >(`/transaction/verify/${encodeURIComponent(reference)}`);

  if (tx.status !== "success") throw new Error("Payment was not successful.");
  if (tx.currency !== "GHS") throw new Error("Unexpected payment currency.");

  const metadata =
    tx.metadata && typeof tx.metadata === "object"
      ? (tx.metadata as Record<string, unknown>)
      : {};
  return { ...tx, metadata };
}

export async function initializePayment(opts: {
  email: string;
  plan: PlanId;
  callbackUrl: string;
}): Promise<{ authorization_url: string; reference: string }> {
  const plan = PLANS[opts.plan];
  return initializeTransaction({
    email: opts.email,
    amountGhs: plan.priceGhs,
    callbackUrl: opts.callbackUrl,
    metadata: { plan: plan.id, product: "ghanalogos-premium" },
  });
}

export async function premiumFromReference(
  reference: string
): Promise<PremiumToken> {
  const tx = await verifyTransaction(reference);
  const { metadata } = tx;

  if (metadata.product !== "ghanalogos-premium" || !isPlanId(metadata.plan)) {
    throw new Error("This reference is not a GhanaLogos Premium payment.");
  }

  const plan = PLANS[metadata.plan];
  if (tx.amount < Math.round(plan.priceGhs * 100)) {
    throw new Error("Payment amount does not match the selected plan.");
  }

  const exp = new Date(tx.paid_at).getTime() + plan.days * 24 * 60 * 60 * 1000;
  if (exp < Date.now()) throw new Error("This Premium plan has expired.");

  return { email: tx.customer.email, plan: plan.id, exp, ref: tx.reference };
}
