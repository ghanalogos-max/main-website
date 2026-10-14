"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountSummary } from "@/lib/developer";
import {
  API_PLANS,
  ApiPlanId,
  BillingPeriod,
  isBillingPeriod,
  isPaidApiPlan,
  planPriceGhs,
} from "@/lib/apiPlans";
import {
  BuildingIcon,
  CheckIcon,
  CodeIcon,
  InfoIcon,
  LoadingIcon,
  ShieldIcon,
  TeamIcon,
  UserIcon,
} from "./icons";

const ICONS = {
  free: CodeIcon,
  individual: UserIcon,
  team: TeamIcon,
  organisation: BuildingIcon,
};

const ORDER: ApiPlanId[] = ["free", "individual", "team", "organisation"];

export default function DevelopersPricing() {
  const router = useRouter();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [selected, setSelected] = useState<ApiPlanId | null>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [organisation, setOrganisation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const p = params.get("period");
    if (isBillingPeriod(p)) setPeriod(p);
    if (isPaidApiPlan(plan)) {
      setSelected(plan);
      requestAnimationFrame(() =>
        document.getElementById("api-checkout")?.scrollIntoView({ block: "center" })
      );
    }
    fetch("/api/developers/account")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setAccount(data))
      .catch(() => {});
  }, []);

  function choose(plan: ApiPlanId) {
    setError(null);
    if (plan === "free") {
      router.push(account ? "/account?tab=developer" : "/signup?next=%2Faccount%3Ftab%3Ddeveloper");
      return;
    }
    setSelected(plan);
    requestAnimationFrame(() =>
      document.getElementById("api-checkout")?.scrollIntoView({ block: "center" })
    );
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/developers/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected, period, organisation }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const plan = selected ? API_PLANS[selected] : null;
  const needsOrg = (selected === "team" || selected === "organisation") && !account?.organisation;
  const next = encodeURIComponent(`/developers?plan=${selected}&period=${period}#pricing`);

  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-gh-black/10 bg-white p-1 dark:border-white/10 dark:bg-ink-900">
          {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                period === p
                  ? "bg-gh-black text-white dark:bg-white dark:text-gh-black"
                  : "text-gh-black/60 hover:text-gh-black dark:text-white/60 dark:hover:text-white"
              }`}
            >
              {p === "monthly" ? "Monthly" : "Yearly · 2 months free"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((id) => {
          const p = API_PLANS[id];
          const Icon = ICONS[id];
          const price = planPriceGhs(id, period);
          const isSelected = selected === id;
          return (
            <div
              key={id}
              className={`panel relative flex flex-col p-6 ${
                isSelected
                  ? "!border-gh-green ring-2 ring-gh-green/30 dark:!border-gh-gold dark:ring-gh-gold/30"
                  : ""
              }`}
            >
              {id === "team" && (
                <span className="absolute -top-3 right-5 rounded-full bg-gh-red px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{p.name}</h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-gh-black/40 dark:text-white/40">
                {p.audience}
              </p>
              <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">{p.blurb}</p>
              <p className="mt-5">
                <span className="font-display text-3xl font-extrabold">
                  GH₵{price.toLocaleString("en")}
                </span>
                {price > 0 && (
                  <span className="text-sm text-gh-black/50 dark:text-white/40">
                    {" "}
                    / {period === "yearly" ? "year" : "month"}
                  </span>
                )}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckIcon size={18} className="shrink-0 text-gh-green dark:text-gh-gold" />
                  {p.monthlyRequests.toLocaleString("en")} requests / month
                </li>
                <li className="flex gap-2">
                  <CheckIcon size={18} className="shrink-0 text-gh-green dark:text-gh-gold" />
                  {p.perMinute.toLocaleString("en")} requests / minute
                </li>
                <li className="flex gap-2">
                  <CheckIcon size={18} className="shrink-0 text-gh-green dark:text-gh-gold" />
                  {p.maxKeys} API key{p.maxKeys === 1 ? "" : "s"}
                </li>
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckIcon size={18} className="shrink-0 text-gh-green dark:text-gh-gold" />
                    {f}
                  </li>
                ))}
                <li className="flex gap-2">
                  <CheckIcon size={18} className="shrink-0 text-gh-green dark:text-gh-gold" />
                  {p.support}
                </li>
              </ul>
              <button
                onClick={() => choose(id)}
                className={`mt-6 w-full ${id === "free" ? "btn-outline" : "btn-dark"}`}
              >
                {id === "free" ? (account ? "Open dashboard" : "Get a free key") : `Choose ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {plan && (
        <form
          id="api-checkout"
          onSubmit={pay}
          className="panel mx-auto mt-8 max-w-xl scroll-mt-28 p-6"
        >
          <h3 className="font-display text-lg font-bold">
            {plan.name} plan · GH₵{planPriceGhs(plan.id, period).toLocaleString("en")} /{" "}
            {period === "yearly" ? "year" : "month"}
          </h3>

          {!account ? (
            <>
              <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">
                Create a free account or sign in to buy this plan. It takes a minute, and your
                plan, keys and receipts stay in one place.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link href={`/signup?next=${next}`} className="btn-primary w-full">
                  Create account
                </Link>
                <Link href={`/login?next=${next}`} className="btn-outline w-full">
                  Sign in
                </Link>
              </div>
            </>
          ) : !account.phoneVerified ? (
            <>
              <p className="mt-3 flex gap-2 rounded-xl border border-gh-gold/50 bg-gh-gold/10 p-3 text-sm">
                <InfoIcon size={18} className="shrink-0" />
                Verify your phone number in the dashboard before buying a plan. We use it to
                protect your account and reach you about billing.
              </p>
              <Link href="/account?tab=developer" className="btn-primary mt-5 w-full">
                Verify phone number
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">
                Signed in as <strong>{account.email}</strong>
                {account.organisation ? ` (${account.organisation})` : ""}. This payment is applied
                to your account.
              </p>
              {needsOrg && (
                <input
                  required
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder={selected === "team" ? "Team or company name" : "Organisation name"}
                  className="input mt-4"
                  autoComplete="organization"
                  maxLength={120}
                />
              )}
              {error && <p className="mt-3 text-sm text-gh-red">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
                {busy && <LoadingIcon size={18} className="animate-spin" />}
                Pay GH₵{planPriceGhs(plan.id, period).toLocaleString("en")} with Paystack
              </button>
            </>
          )}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gh-black/50 dark:text-white/40">
            <ShieldIcon size={14} />
            Paid to Celestial Web Solutions via Paystack · Mobile Money &amp; cards · no auto-renewal
          </p>
        </form>
      )}
    </div>
  );
}
