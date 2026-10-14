import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PayoutForm from "@/components/PayoutForm";
import { PhoneIcon, UploadIcon } from "@/components/icons";
import { getSessionAccount } from "@/lib/developer";
import {
  CONTRIBUTOR_SHARE,
  MOMO_NETWORKS,
  PAYOUT_MINIMUM_GHS,
  contributorEarnings,
} from "@/lib/contributors";
import { submissionsFor } from "@/lib/sanity.client";
import { storeEnabled } from "@/lib/store";
import { formatPhone } from "@/lib/verification";

export const metadata: Metadata = {
  title: "Contributor Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ghs = (n: number) =>
  `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gh-gold/15 text-amber-700 dark:text-gh-gold",
  approved: "bg-gh-green/10 text-gh-green",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default async function ContributorDashboardPage() {
  if (!storeEnabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-gh-black/60 dark:text-white/50">
        Accounts aren&apos;t available yet. Please try again later.
      </div>
    );
  }
  const account = await getSessionAccount();
  if (!account) redirect("/login?next=%2Fcontributors%2Fdashboard");

  const [earnings, submissions] = await Promise.all([
    contributorEarnings(account.id),
    submissionsFor(account.id).catch(() => []),
  ]);
  const current = earnings.months.find((m) => !m.final);
  const approved = submissions.filter((s) => s.status === "approved").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gh-black/50 dark:text-white/40">Contributor dashboard</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Hi, {account.name.split(" ")[0]}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/contributors" className="btn-dark">
            How it works
          </Link>
          {account.payout && (
            <Link href="/contribute" className="btn-primary">
              <UploadIcon size={16} />
              Submit a logo
            </Link>
          )}
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Unpaid balance", ghs(earnings.balanceGhs), `Paid out at GHS ${PAYOUT_MINIMUM_GHS}`],
          ["This month (estimate)", ghs(current?.earningsGhs ?? 0), `${current?.downloads ?? 0} downloads so far`],
          ["Paid to date", ghs(earnings.paidGhs), "By Mobile Money"],
          ["Approved logos", String(approved), `${submissions.length} submitted`],
        ].map(([label, value, hint]) => (
          <div key={label} className="panel p-5">
            <p className="text-sm text-gh-black/50 dark:text-white/40">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-gh-black/50 dark:text-white/40">{hint}</p>
          </div>
        ))}
      </section>

      <section className="panel mt-6 p-6">
        <div className="flex items-center gap-2">
          <PhoneIcon size={18} className="text-gh-green dark:text-gh-gold" />
          <h2 className="font-display text-lg font-bold">Mobile Money payout details</h2>
        </div>
        {account.payout ? (
          <p className="mt-1 text-sm text-gh-black/60 dark:text-white/50">
            Payments go to {MOMO_NETWORKS[account.payout.network]} {formatPhone(account.payout.number)} (
            {account.payout.accountName}).
          </p>
        ) : (
          <p className="mt-1 text-sm text-amber-700 dark:text-gh-gold">
            Add your Mobile Money number before submitting logos, so we can pay your earnings.
          </p>
        )}
        <div className="mt-5">
          <PayoutForm
            initial={{
              network: account.payout?.network,
              number: account.payout
                ? `0${account.payout.number.slice(3)}`
                : account.phone?.startsWith("233")
                  ? `0${account.phone.slice(3)}`
                  : "",
              accountName: account.payout?.accountName ?? account.name,
            }}
          />
        </div>
      </section>

      <section className="panel mt-6 overflow-hidden">
        <div className="p-6 pb-3">
          <h2 className="font-display text-lg font-bold">Monthly earnings</h2>
          <p className="mt-1 text-sm text-gh-black/60 dark:text-white/50">
            Your share of the {CONTRIBUTOR_SHARE * 100}% contributor pool, based on your
            logos&apos; share of all website downloads.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gh-black/50 dark:text-white/40">
              <tr>
                <th className="px-6 py-2 font-medium">Month</th>
                <th className="px-6 py-2 font-medium">Your downloads</th>
                <th className="px-6 py-2 font-medium">Share</th>
                <th className="px-6 py-2 font-medium">Pool</th>
                <th className="px-6 py-2 font-medium">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gh-black/5 dark:divide-white/5">
              {earnings.months.map((m) => (
                <tr key={m.month}>
                  <td className="px-6 py-3 font-medium">
                    {monthLabel(m.month)}
                    {!m.final && (
                      <span className="ml-2 text-xs text-gh-black/40 dark:text-white/40">in progress</span>
                    )}
                  </td>
                  <td className="px-6 py-3">{m.downloads.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    {m.totalDownloads ? `${((m.downloads / m.totalDownloads) * 100).toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-6 py-3">{ghs(m.poolGhs)}</td>
                  <td className="px-6 py-3 font-semibold">{ghs(m.earningsGhs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mt-6 overflow-hidden">
        <h2 className="p-6 pb-3 font-display text-lg font-bold">Your submissions</h2>
        {submissions.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-gh-black/60 dark:text-white/50">
            No submissions yet.{" "}
            {account.payout && (
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
                <div className="flex items-center gap-3">
                  {s.status === "approved" && (
                    <span className="text-xs text-gh-black/50 dark:text-white/40">
                      {(s.logoDownloads ?? 0).toLocaleString()} downloads all time
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[s.status] ?? ""}`}>
                    {s.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
