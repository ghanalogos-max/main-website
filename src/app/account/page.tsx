import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeveloperDashboard from "@/components/DeveloperDashboard";
import PayoutForm from "@/components/account/PayoutForm";
import PhoneCard from "@/components/account/PhoneCard";
import PhoneVerification from "@/components/account/PhoneVerification";
import SignOutButton from "@/components/account/SignOutButton";
import {
  ChartIcon,
  CheckIcon,
  CodeIcon,
  GithubIcon,
  GoogleIcon,
  LockIcon,
  UploadIcon,
  UserIcon,
} from "@/components/icons";
import { API_PLANS } from "@/lib/apiPlans";
import {
  MOMO_NETWORKS,
  PAYOUT_MINIMUM_GHS,
  REWARD_BATCH,
  REWARD_GHS,
  contributorEarnings,
} from "@/lib/contributors";
import { accountSummary, effectivePlan, getSessionAccount, type DevAccount } from "@/lib/developer";
import { approvedCountFor, submissionsFor } from "@/lib/sanity.client";
import { storeEnabled } from "@/lib/store";

export const metadata: Metadata = {
  title: "Your Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Tab = "overview" | "developer" | "contributions";

const TABS: { id: Tab; label: string; icon: typeof UserIcon }[] = [
  { id: "overview", label: "Overview", icon: UserIcon },
  { id: "developer", label: "Developer API", icon: CodeIcon },
  { id: "contributions", label: "Contributions", icon: UploadIcon },
];

const tabHref = (tab: Tab) => (tab === "overview" ? "/account" : `/account?tab=${tab}`);
const ghs = (n: number) => `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gh-gold/15 text-amber-700 dark:text-gh-gold",
  approved: "bg-gh-green/10 text-gh-green",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gh-black/40 dark:text-white/40">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-sm text-gh-black/60 dark:text-white/50">{hint}</p>}
    </div>
  );
}

async function contributionData(account: DevAccount) {
  const [approved, submissions] = await Promise.all([
    approvedCountFor(account.id).catch(() => 0),
    submissionsFor(account.id).catch(() => []),
  ]);
  return { earnings: await contributorEarnings(account.id, approved), submissions };
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { tab?: string; status?: string; message?: string };
}) {
  if (!storeEnabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-gh-black/60 dark:text-white/50">
        Accounts aren&apos;t available yet. Please try again later.
      </div>
    );
  }
  const tab: Tab = TABS.some((t) => t.id === searchParams.tab) ? (searchParams.tab as Tab) : "overview";
  const account = await getSessionAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(tabHref(tab))}`);

  const summary = await accountSummary(account);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gh-black/50 dark:text-white/40">Your account</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {summary.organisation || summary.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gh-black/60 dark:text-white/50">
            {summary.email}
            {summary.phone && <span>· {summary.phone}</span>}
            {summary.emailVerified && summary.phoneVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gh-green/10 px-2 py-0.5 text-xs font-semibold text-gh-green">
                <CheckIcon size={12} />
                Verified
              </span>
            )}
          </p>
        </div>
        <SignOutButton />
      </div>

      <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-gh-black/10 dark:border-white/10" aria-label="Account sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={tabHref(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              tab === id
                ? "border-gh-green text-gh-black dark:border-gh-gold dark:text-white"
                : "border-transparent text-gh-black/50 hover:text-gh-black dark:text-white/50 dark:hover:text-white"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "developer" && (
          <DeveloperDashboard status={searchParams.status} message={searchParams.message} />
        )}
        {tab === "overview" && <Overview account={account} summary={summary} />}
        {tab === "contributions" && <Contributions account={account} phone={summary.phone} />}
      </div>
    </div>
  );
}

async function Overview({
  account,
  summary,
}: {
  account: DevAccount;
  summary: Awaited<ReturnType<typeof accountSummary>>;
}) {
  const { earnings } = await contributionData(account);
  const plan = effectivePlan(account);

  return (
    <div className="grid gap-6">
      <PhoneCard phone={summary.phone} verified={summary.phoneVerified} />

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={tabHref("developer")} className="panel block p-6 transition-colors hover:border-gh-green">
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <CodeIcon size={20} /> Developer API
          </p>
          <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">
            {API_PLANS[plan.id].name} plan · {summary.keys.length} key{summary.keys.length === 1 ? "" : "s"} ·{" "}
            {summary.usage.used.toLocaleString("en")} requests this month
          </p>
        </Link>
        <Link href={tabHref("contributions")} className="panel block p-6 transition-colors hover:border-gh-green">
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <ChartIcon size={20} /> Contributions
          </p>
          <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">
            {earnings.approved} approved logo{earnings.approved === 1 ? "" : "s"} · {ghs(earnings.balanceGhs)} unpaid
          </p>
        </Link>
      </div>

      <section className="panel p-6">
        <h2 className="font-display text-lg font-bold">Sign-in methods</h2>
        <ul className="mt-4 divide-y divide-gh-black/5 text-sm dark:divide-white/5">
          {[
            { id: "password", label: "Email & password", Icon: LockIcon, on: summary.signInMethods.password },
            { id: "google", label: "Google", Icon: GoogleIcon, on: summary.signInMethods.google },
            { id: "github", label: "GitHub", Icon: GithubIcon, on: summary.signInMethods.github },
          ].map(({ id, label, Icon, on }) => (
            <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="flex items-center gap-2 font-medium">
                <Icon size={18} />
                {label}
              </span>
              {on ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gh-green">
                  <CheckIcon size={14} /> Connected
                </span>
              ) : id === "password" ? (
                <Link href="/forgot-password" className="text-xs font-semibold text-gh-green hover:underline dark:text-gh-gold">
                  Set a password
                </Link>
              ) : (
                <span className="text-xs text-gh-black/50 dark:text-white/40">
                  Sign in with {label} using {summary.email} to connect
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gh-black/50 dark:text-white/40">
          Forgot your password? You can always sign in with the receipt number from any plan payment.
        </p>
      </section>
    </div>
  );
}

async function Contributions({ account, phone }: { account: DevAccount; phone: string | null }) {
  const { earnings, submissions } = await contributionData(account);
  const verified = Boolean(account.phone && account.phoneVerifiedAt);
  const ready = verified && Boolean(account.payout);
  const progress = earnings.approved % REWARD_BATCH;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gh-black/60 dark:text-white/50">
          Earn {ghs(REWARD_GHS)} for every {REWARD_BATCH} logos we approve.{" "}
          <Link href="/contributors" className="font-semibold text-gh-green underline-offset-2 hover:underline dark:text-gh-gold">
            How it works
          </Link>
        </p>
        {ready && (
          <Link href="/contribute" className="btn-primary">
            <UploadIcon size={16} />
            Submit a logo
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Unpaid balance" value={ghs(earnings.balanceGhs)} hint={`Paid out from ${ghs(PAYOUT_MINIMUM_GHS)}`} />
        <Stat label="Approved logos" value={String(earnings.approved)} hint={`${submissions.length} submitted`} />
        <div className="panel p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gh-black/40 dark:text-white/40">
            Next reward
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {progress}
            <span className="text-base font-semibold text-gh-black/40 dark:text-white/40"> / {REWARD_BATCH}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gh-black/5 dark:bg-white/10">
            <div className="h-full rounded-full bg-gh-green" style={{ width: `${(progress / REWARD_BATCH) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-gh-black/50 dark:text-white/40">
            {earnings.toNextReward} more approved logo{earnings.toNextReward === 1 ? "" : "s"} to earn {ghs(REWARD_GHS)}
          </p>
        </div>
        <Stat label="Paid to date" value={ghs(earnings.paidGhs)} hint="By Mobile Money" />
      </div>

      {!verified ? (
        <PhoneVerification
          current={phone}
          title="Verify your Mobile Money number"
          description="Rewards are only paid to your verified phone number, so verify the number on your Mobile Money wallet. We'll send a 6-digit code by SMS."
        />
      ) : (
        <section className="panel p-6">
          <h2 className="font-display text-lg font-bold">Mobile Money wallet</h2>
          <p className="mt-1 text-sm text-gh-black/60 dark:text-white/50">
            {account.payout
              ? `Rewards go to ${MOMO_NETWORKS[account.payout.network]} ${phone} (${account.payout.accountName}).`
              : "Confirm your wallet details before submitting logos."}{" "}
            To use a different number,{" "}
            <Link href="/account" className="font-semibold text-gh-green underline dark:text-gh-gold">
              change your phone number
            </Link>
            .
          </p>
          <div className="mt-5">
            <PayoutForm
              phone={phone ?? ""}
              initial={{ network: account.payout?.network, accountName: account.payout?.accountName ?? account.name }}
            />
          </div>
        </section>
      )}

      <section className="panel overflow-hidden">
        <h2 className="p-6 pb-3 font-display text-lg font-bold">Your submissions</h2>
        {submissions.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-gh-black/60 dark:text-white/50">
            No submissions yet.{" "}
            {ready && (
              <Link href="/contribute" className="font-semibold text-gh-green underline-offset-2 hover:underline">
                Submit your first logo
              </Link>
            )}
          </p>
        ) : (
          <ul className="divide-y divide-gh-black/5 dark:divide-white/5">
            {submissions.map((s) => (
              <li key={s._id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <div>
                  {s.logoSlug ? (
                    <Link href={`/logo/${s.logoSlug}`} className="font-semibold hover:text-gh-green">
                      {s.companyName}
                    </Link>
                  ) : (
                    <span className="font-semibold">{s.companyName}</span>
                  )}
                  <span className="ml-2 text-xs text-gh-black/40 dark:text-white/40">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("en-GB") : ""}
                  </span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[s.status] ?? ""}`}>
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
