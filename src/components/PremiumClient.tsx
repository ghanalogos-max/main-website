"use client";

import { useEffect, useState } from "react";
import { FREE_DAILY_LIMIT, PLANS, PlanId } from "@/lib/plans";
import { useDownloads } from "./DownloadProvider";
import {
  CheckIcon,
  CrownIcon,
  LoadingIcon,
  MailIcon,
  ShieldIcon,
  InfoIcon,
  RefreshIcon,
} from "./icons";

const FREE_FEATURES = [
  `${FREE_DAILY_LIMIT} downloads per day`,
  "SVG + PNG up to 2048px",
  "Copy SVG code",
];

const PREMIUM_FEATURES = [
  "Unlimited downloads",
  "4K (4096px) PNG exports",
  "Unlimited SVG code copying",
  "Priority logo requests",
];

export default function PremiumClient({
  status,
  message,
}: {
  status?: string;
  message?: string;
}) {
  const { quota, refresh } = useDownloads();
  const [plan, setPlan] = useState<PlanId>("yearly");
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === "success") refresh();
  }, [status, refresh]);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment.");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setPaying(false);
    }
  }

  async function restore(e: React.FormEvent) {
    e.preventDefault();
    setRestoring(true);
    setRestoreMsg(null);
    try {
      const res = await fetch("/api/premium/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not restore purchase.");
      await refresh();
      setRestoreMsg("Premium restored on this device.");
    } catch (err) {
      setRestoreMsg((err as Error).message);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <>
      <div className="text-center">
        <span className="eyebrow">
          <CrownIcon size={14} />
          GhanaLogos Premium
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Unlimited Ghanaian logos, whenever you need them
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-gh-black/60 dark:text-white/60">
          Free for everyone up to {FREE_DAILY_LIMIT} downloads a day. Go
          Premium for unlimited downloads and 4K exports — pay once with
          Mobile Money or card.
        </p>
      </div>

      {status === "success" && (
        <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-2xl border border-gh-green/30 bg-gh-green/10 p-4 text-sm font-medium text-gh-green">
          <CheckIcon size={20} />
          Payment confirmed — Premium is now active. Enjoy unlimited downloads!
        </div>
      )}
      {status === "error" && (
        <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-2xl border border-gh-red/30 bg-gh-red/10 p-4 text-sm font-medium text-gh-red">
          <InfoIcon size={20} />
          {message || "We couldn't confirm your payment. If you were charged, use Restore purchase below."}
        </div>
      )}

      {quota?.premium && (
        <div className="panel mx-auto mt-8 flex max-w-xl items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gh-gold/20 text-[#9A7B00] dark:text-gh-gold">
            <CrownIcon size={24} />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Premium is active on this device</p>
            <p className="text-gh-black/60 dark:text-white/50">
              {quota.premium.email} · active until{" "}
              {new Date(quota.premium.expiresAt).toLocaleDateString("en-GH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      )}

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <div className="panel flex flex-col p-6">
          <h2 className="font-display text-lg font-bold">Free</h2>
          <p className="mt-1 text-sm text-gh-black/50 dark:text-white/40">
            For occasional use.
          </p>
          <p className="mt-5 font-display text-4xl font-extrabold">GH₵0</p>
          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckIcon size={18} className="shrink-0 text-gh-black/40 dark:text-white/40" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-xl bg-gh-black/5 py-2.5 text-center text-sm font-semibold text-gh-black/60 dark:bg-white/5 dark:text-white/60">
            {quota && !quota.premium
              ? `${quota.remaining} of ${quota.limit} left today`
              : "Included"}
          </p>
        </div>

        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          const selected = plan === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPlan(id)}
              className={`panel relative flex flex-col p-6 text-left transition-all ${
                selected
                  ? "!border-gh-green ring-2 ring-gh-green/30 dark:!border-gh-gold dark:ring-gh-gold/30"
                  : "hover:border-gh-black/25 dark:hover:border-white/25"
              }`}
            >
              {id === "yearly" && (
                <span className="absolute -top-3 right-5 rounded-full bg-gh-red px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Best value
                </span>
              )}
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">{p.name}</h2>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    selected
                      ? "border-gh-green bg-gh-green text-white dark:border-gh-gold dark:bg-gh-gold dark:text-gh-black"
                      : "border-gh-black/20 dark:border-white/20"
                  }`}
                >
                  {selected && <CheckIcon size={12} />}
                </span>
              </div>
              <p className="mt-1 text-sm text-gh-black/50 dark:text-white/40">{p.blurb}</p>
              <p className="mt-5">
                <span className="font-display text-4xl font-extrabold">GH₵{p.priceGhs}</span>
                <span className="text-sm text-gh-black/50 dark:text-white/40">
                  {" "}
                  / {p.days === 365 ? "year" : "month"}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckIcon size={18} className="shrink-0 text-gh-green dark:text-gh-gold" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-[1.4fr_1fr]">
        <form onSubmit={pay} className="panel p-6">
          <h2 className="font-display text-lg font-bold">
            Checkout · {PLANS[plan].name}
          </h2>
          <label className="mt-4 block text-sm font-medium" htmlFor="email">
            Email for your receipt
          </label>
          <div className="relative mt-1.5">
            <MailIcon
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gh-black/40 dark:text-white/40"
            />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com.gh"
              className="input pl-10"
            />
          </div>
          {error && <p className="mt-2 text-sm text-gh-red">{error}</p>}
          <button type="submit" disabled={paying} className="btn-gold mt-4 w-full">
            {paying ? <LoadingIcon size={18} className="animate-spin" /> : <CrownIcon size={18} />}
            Pay GH₵{PLANS[plan].priceGhs} with Paystack
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gh-black/50 dark:text-white/40">
            <ShieldIcon size={14} />
            Secured by Paystack · Mobile Money &amp; cards
          </p>
          <p className="mt-1 text-center text-xs text-gh-black/50 dark:text-white/40">
            Payment is made to Celestial Web Solutions.
          </p>
        </form>

        <form onSubmit={restore} className="panel p-6">
          <h2 className="font-display text-lg font-bold">Restore purchase</h2>
          <p className="mt-1 text-xs text-gh-black/50 dark:text-white/40">
            Paid already? Enter the reference from your Paystack receipt.
          </p>
          <input
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. T123456789"
            className="input mt-4"
          />
          <button type="submit" disabled={restoring} className="btn-outline mt-3 w-full">
            {restoring ? <LoadingIcon size={16} className="animate-spin" /> : <RefreshIcon size={16} />}
            Restore
          </button>
          {restoreMsg && (
            <p className="mt-2 text-xs text-gh-black/60 dark:text-white/60">{restoreMsg}</p>
          )}
        </form>
      </div>
    </>
  );
}
