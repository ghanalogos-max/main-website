"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AccountSummary } from "@/lib/developer";
import {
  API_PLANS,
  BillingPeriod,
  PAID_API_PLANS,
  planPriceGhs,
} from "@/lib/apiPlans";
import CodeBlock from "./CodeBlock";
import {
  AddIcon,
  CheckIcon,
  CopyIcon,
  DeleteIcon,
  InfoIcon,
  KeyIcon,
  LoadingIcon,
  PhoneIcon,
} from "./icons";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.ghanalogos.com").trim().replace(/\/+$/, "");

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}

export default function DeveloperDashboard({
  status,
  message,
}: {
  status?: string;
  message?: string;
}) {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [website, setWebsite] = useState("");
  const [allowLocalhost, setAllowLocalhost] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const load = useCallback(async () => {
    const res = await fetch("/api/developers/account");
    if (res.status === 401) {
      window.location.assign("/login?next=%2Faccount%3Ftab%3Ddeveloper");
      return;
    }
    if (res.status === 503) setUnavailable(true);
    setAccount(res.ok ? await res.json() : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setError(null);
    try {
      const data = await call<{ key: string; account: AccountSummary }>("/api/developers/keys", {
        method: "POST",
        body: JSON.stringify({ name: keyName, website, allowLocalhost }),
      });
      setNewKey(data.key);
      setAccount(data.account);
      setKeyName("");
      setWebsite("");
      setAllowLocalhost(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function revoke(id: string, name: string) {
    if (!confirm(`Revoke "${name}"? Apps using this key will stop working immediately.`)) return;
    setBusy(id);
    setError(null);
    try {
      setAccount(
        await call<AccountSummary>(`/api/developers/keys?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function buy(plan: string) {
    setBusy(`buy-${plan}`);
    setError(null);
    try {
      const { url } = await call<{ url: string }>("/api/developers/checkout", {
        method: "POST",
        body: JSON.stringify({ plan, period }),
      });
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingIcon size={28} className="animate-spin text-gh-black/40 dark:text-white/40" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <InfoIcon size={28} className="mx-auto text-gh-black/40 dark:text-white/40" />
        <p className="mt-3 font-semibold">The developer API isn&apos;t available yet.</p>
        <p className="mt-1 text-sm text-gh-black/60 dark:text-white/50">Please check back soon.</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <InfoIcon size={28} className="mx-auto text-gh-black/40 dark:text-white/40" />
        <p className="mt-3 font-semibold">We couldn&apos;t load your account.</p>
        <button onClick={() => window.location.reload()} className="btn-outline mt-4">
          Try again
        </button>
      </div>
    );
  }

  const plan = API_PLANS[account.plan];
  const usedPct = Math.min(100, (account.usage.used / account.limits.monthlyRequests) * 100);
  const canCreate = account.phoneVerified && account.keys.length < account.limits.maxKeys;
  const example = `curl ${SITE}/api/v1/logos?per_page=5 \\
  -H "Authorization: Bearer ${newKey ?? "YOUR_API_KEY"}"`;

  return (
    <div>
      {status === "success" && (
        <p className="mb-6 flex items-center gap-2 rounded-2xl border border-gh-green/30 bg-gh-green/10 p-4 text-sm font-medium text-gh-green">
          <CheckIcon size={18} />
          Payment confirmed — your {plan.name} plan is active.
          {account.keys.length === 0 && " Create your first API key below."}
        </p>
      )}
      {status === "error" && (
        <p className="mb-6 rounded-2xl border border-gh-red/30 bg-gh-red/10 p-4 text-sm font-medium text-gh-red">
          {message ||
            "We couldn't confirm your payment. If you were charged, contact support with your Paystack reference."}
        </p>
      )}
      {!account.phoneVerified && (
        <p className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-gh-gold/50 bg-gh-gold/10 p-4 text-sm font-medium">
          <PhoneIcon size={18} />
          Verify your phone number to create API keys and buy plans.
          <Link href="/account" className="font-semibold text-gh-green underline dark:text-gh-gold">
            Verify now
          </Link>
        </p>
      )}
      {status === "welcome" && account.keys.length === 0 && (
        <p className="mb-6 flex items-center gap-2 rounded-2xl border border-gh-green/30 bg-gh-green/10 p-4 text-sm font-medium text-gh-green">
          <CheckIcon size={18} />
          Your Sandbox account is ready. Create your first API key below.
        </p>
      )}
      {account.expired && (
        <p className="mb-6 flex items-center gap-2 rounded-2xl border border-gh-gold/50 bg-gh-gold/15 p-4 text-sm font-medium">
          <InfoIcon size={18} />
          Your {API_PLANS[account.purchasedPlan].name} plan ended on{" "}
          {formatDate(account.expiresAt!)}. You&apos;re on Sandbox limits until you renew.
        </p>
      )}
      {error && (
        <p className="mb-6 rounded-2xl border border-gh-red/30 bg-gh-red/10 p-4 text-sm font-medium text-gh-red">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gh-black/40 dark:text-white/40">Plan</p>
          <p className="mt-2 font-display text-2xl font-extrabold">{plan.name}</p>
          <p className="mt-1 text-sm text-gh-black/60 dark:text-white/50">
            {account.plan === "free"
              ? "Free · non-commercial use"
              : `Active until ${formatDate(account.expiresAt!)}`}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gh-black/40 dark:text-white/40">
            Requests this month
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {account.usage.used.toLocaleString("en")}
            <span className="text-base font-semibold text-gh-black/40 dark:text-white/40">
              {" "}
              / {account.limits.monthlyRequests.toLocaleString("en")}
            </span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gh-black/5 dark:bg-white/10">
            <div
              className={`h-full rounded-full ${usedPct > 90 ? "bg-gh-red" : "bg-gh-green"}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gh-black/50 dark:text-white/40">
            Resets {formatDate(account.usage.resetsAt)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gh-black/40 dark:text-white/40">Limits</p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {account.limits.perMinute.toLocaleString("en")}
            <span className="text-base font-semibold text-gh-black/40 dark:text-white/40"> req / min</span>
          </p>
          <p className="mt-1 text-sm text-gh-black/60 dark:text-white/50">
            {account.keys.length} of {account.limits.maxKeys} API key{account.limits.maxKeys === 1 ? "" : "s"} used
          </p>
        </div>
      </div>

      <section className="panel mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <KeyIcon size={20} />
            API keys
          </h2>
          <Link href="/developers/docs" className="text-sm font-semibold text-gh-green hover:underline dark:text-gh-gold">
            API documentation
          </Link>
        </div>

        {newKey && (
          <div className="mt-5 rounded-2xl border border-gh-gold/50 bg-gh-gold/10 p-4">
            <p className="text-sm font-semibold">
              Copy your new key now — it won&apos;t be shown again.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-sm dark:bg-ink-950">
                {newKey}
              </code>
              <button onClick={copyKey} className="btn-dark !px-4 !py-2">
                {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {account.keys.length > 0 ? (
          <ul className="mt-5 divide-y divide-gh-black/5 dark:divide-white/5">
            {account.keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{k.name}</p>
                  <p className="text-xs text-gh-black/60 dark:text-white/50">
                    {k.website ? (
                      <>
                        For <strong>{k.website}</strong>
                        {k.allowLocalhost && " + localhost"}
                      </>
                    ) : (
                      "Any website (legacy key)"
                    )}
                  </p>
                  <p className="font-mono text-xs text-gh-black/50 dark:text-white/40">
                    {k.prefix}… · created {formatDate(k.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => revoke(k.id, k.name)}
                  disabled={busy === k.id}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gh-red hover:bg-gh-red/10"
                >
                  {busy === k.id ? <LoadingIcon size={16} className="animate-spin" /> : <DeleteIcon size={16} />}
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-gh-black/60 dark:text-white/50">No API keys yet.</p>
        )}

        <form onSubmit={createKey} className="mt-5 grid gap-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              required
              type="text"
              inputMode="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website, e.g. https://example.com"
              className="input"
              disabled={!canCreate}
              aria-label="Website"
            />
            <input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key name (optional), e.g. Production"
              className="input"
              disabled={!canCreate}
              aria-label="Key name"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gh-black/70 dark:text-white/70">
              <input
                type="checkbox"
                checked={allowLocalhost}
                onChange={(e) => setAllowLocalhost(e.target.checked)}
                disabled={!canCreate}
                className="h-4 w-4 accent-gh-green"
              />
              Also allow localhost (for development)
            </label>
            <button type="submit" disabled={!canCreate || busy === "create"} className="btn-primary">
              {busy === "create" ? <LoadingIcon size={18} className="animate-spin" /> : <AddIcon size={18} />}
              Create key
            </button>
          </div>
          <p className="text-xs text-gh-black/50 dark:text-white/40">
            Each key is tied to one website and its subdomains. Browser requests from any other site
            are rejected; requests from your own server always work, so keep the key secret.
          </p>
        </form>
        {account.phoneVerified && !canCreate && (
          <p className="mt-2 text-xs text-gh-black/50 dark:text-white/40">
            You&apos;ve reached your plan&apos;s key limit. Revoke a key or upgrade below.
          </p>
        )}
      </section>

      <section className="mt-6">
        <CodeBlock label="Quick start" code={example} />
      </section>

      <section className="panel mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">
            {account.plan === "free" ? "Upgrade your plan" : "Renew or change plan"}
          </h2>
          <div className="inline-flex rounded-full border border-gh-black/10 p-1 dark:border-white/10">
            {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                  period === p
                    ? "bg-gh-black text-white dark:bg-white dark:text-gh-black"
                    : "text-gh-black/60 dark:text-white/60"
                }`}
              >
                {p === "monthly" ? "Monthly" : "Yearly · 2 months free"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {PAID_API_PLANS.map((id) => {
            const p = API_PLANS[id];
            const current = account.plan === id;
            return (
              <div key={id} className="rounded-2xl border border-gh-black/10 p-5 dark:border-white/10">
                <p className="font-display font-bold">{p.name}</p>
                <p className="mt-1 text-xs text-gh-black/50 dark:text-white/40">
                  {p.monthlyRequests.toLocaleString("en")} req / month · {p.maxKeys} keys
                </p>
                <p className="mt-3 font-display text-2xl font-extrabold">
                  GH₵{planPriceGhs(id, period).toLocaleString("en")}
                  <span className="text-sm font-semibold text-gh-black/40 dark:text-white/40">
                    {" "}
                    / {period === "yearly" ? "year" : "month"}
                  </span>
                </p>
                <button
                  onClick={() => buy(id)}
                  disabled={busy !== null || !account.phoneVerified}
                  className={`mt-4 w-full ${current ? "btn-primary" : "btn-outline"}`}
                >
                  {busy === `buy-${id}` && <LoadingIcon size={16} className="animate-spin" />}
                  {current ? "Renew" : account.plan === "free" ? "Upgrade" : "Switch"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-gh-black/50 dark:text-white/40">
          Paid to Celestial Web Solutions via Paystack. Renewing adds time to
          your current plan; switching plans starts the new plan immediately.
        </p>
      </section>

      {account.payments.length > 0 && (
        <section className="panel mt-6 overflow-x-auto p-6">
          <h2 className="font-display text-lg font-bold">Payments</h2>
          <table className="mt-4 w-full min-w-[520px] text-left text-sm">
            <thead className="text-gh-black/50 dark:text-white/40">
              <tr>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gh-black/5 dark:divide-white/5">
              {[...account.payments].reverse().map((p) => (
                <tr key={p.reference}>
                  <td className="py-2">{formatDate(p.paidAt)}</td>
                  <td className="py-2">
                    {API_PLANS[p.plan].name} · {p.period}
                  </td>
                  <td className="py-2">GH₵{p.amountGhs.toLocaleString("en")}</td>
                  <td className="py-2 font-mono text-xs">{p.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
