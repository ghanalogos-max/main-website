import type { Metadata } from "next";
import Link from "next/link";
import {
  ChartIcon,
  DownloadIcon,
  PhoneIcon,
  ShieldIcon,
  UploadIcon,
  UserIcon,
} from "@/components/icons";
import { CONTRIBUTOR_SHARE, PAYOUT_MINIMUM_GHS } from "@/lib/contributors";
import { PLANS } from "@/lib/plans";
import { sessionName } from "@/lib/developer";

const SHARE = `${CONTRIBUTOR_SHARE * 100}%`;

export const metadata: Metadata = {
  title: "Contributor Programme — Earn From Your Logo Submissions",
  description: `Submit official Ghanaian brand logos to GhanaLogos and earn ${SHARE} of Premium revenue, shared by downloads. Paid monthly by Mobile Money.`,
  alternates: { canonical: "/contributors" },
};

const STEPS = [
  {
    icon: UserIcon,
    title: "Create an account",
    text: "Sign up with your email, Google or GitHub and add your Mobile Money number.",
  },
  {
    icon: UploadIcon,
    title: "Submit official logos",
    text: "Upload SVG or PNG artwork from the brand's own website or guidelines.",
  },
  {
    icon: ShieldIcon,
    title: "We review it",
    text: "Our team checks every logo. Approved logos go live with your name on them.",
  },
  {
    icon: DownloadIcon,
    title: "Earn from downloads",
    text: `Every month, ${SHARE} of Premium revenue is shared among contributors by downloads.`,
  },
];

const FAQ = [
  {
    q: "How are earnings calculated?",
    a: `Each month, ${SHARE} of that month's Premium revenue goes into the contributor pool. You receive the part of the pool that matches your logos' share of all downloads on the website. If your logos made 2% of all downloads, you get 2% of the pool.`,
  },
  {
    q: "Is there a fee to join?",
    a: "No. The programme is free. You only need a GhanaLogos account and a Mobile Money wallet in your name.",
  },
  {
    q: "When do I get paid?",
    a: `Earnings are finalised at the end of each month and paid by Mobile Money (MTN MoMo, Telecel Cash or AT Money) by the 10th of the next month, once your unpaid balance reaches GHS ${PAYOUT_MINIMUM_GHS}. Smaller balances carry over.`,
  },
  {
    q: "Which downloads count?",
    a: "Downloads from the GhanaLogos website count, whether the visitor is on the free plan or Premium. Each visitor counts once per logo per day. Downloads through the Developer API and downloads of your own logos while signed in don't count.",
  },
  {
    q: "What logos can I submit?",
    a: "Official logos of Ghanaian companies, organisations and institutions that aren't already in the library. Use the brand's own artwork; don't redraw, edit or upload a logo you made up. Duplicates of existing logos aren't accepted.",
  },
  {
    q: "Do I own the logo once it's approved?",
    a: "No. Logos remain the trademarks of their owners. You're rewarded for finding and preparing the official artwork, not for owning it. If a brand owner asks us to remove a logo, it stops earning.",
  },
  {
    q: "What happens if someone cheats?",
    a: "Fake downloads, bots, stolen or altered artwork, or several accounts per person lead to the earnings being withheld and the account being removed from the programme.",
  },
];

export default function ContributorsPage() {
  const signedIn = Boolean(sessionName());

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <section className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">
          <ChartIcon size={14} />
          Contributor programme
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
          Earn {SHARE} of Premium revenue from the logos you add
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-gh-black/60 dark:text-white/50">
          Help build Ghana&apos;s logo library. When your approved logos are downloaded,
          you earn a share of every month&apos;s Premium sales, paid straight to your
          Mobile Money wallet.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {signedIn ? (
            <>
              <Link href="/contribute" className="btn-primary">
                <UploadIcon size={16} />
                Submit a logo
              </Link>
              <Link href="/contributors/dashboard" className="btn-dark">
                My earnings
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup?next=%2Fcontributors%2Fdashboard" className="btn-primary">
                Join for free
              </Link>
              <Link href="/login?next=%2Fcontributors%2Fdashboard" className="btn-dark">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="panel p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
              <Icon size={20} />
            </span>
            <h2 className="mt-4 font-display font-bold">
              {i + 1}. {title}
            </h2>
            <p className="mt-1.5 text-sm text-gh-black/60 dark:text-white/50">{text}</p>
          </div>
        ))}
      </section>

      <section className="panel mx-auto mt-12 max-w-3xl p-6">
        <h2 className="font-display text-xl font-bold">An example month</h2>
        <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">
          These numbers are only an illustration. Real earnings depend on Premium sales
          and downloads.
        </p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["Premium sales that month", `100 × GHS ${PLANS.monthly.priceGhs} = GHS ${100 * PLANS.monthly.priceGhs}`],
            ["Contributor pool (" + SHARE + ")", `GHS ${100 * PLANS.monthly.priceGhs * CONTRIBUTOR_SHARE}`],
            ["Your logos' downloads", "1,500 of 30,000 (5%)"],
            ["You earn", `GHS ${100 * PLANS.monthly.priceGhs * CONTRIBUTOR_SHARE * 0.05}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gh-black/[0.03] px-4 py-3 dark:bg-white/5">
              <dt className="text-gh-black/50 dark:text-white/40">{label}</dt>
              <dd className="mt-0.5 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 flex items-start gap-2 text-sm text-gh-black/60 dark:text-white/50">
          <PhoneIcon size={16} className="mt-0.5 shrink-0" />
          Paid monthly by Mobile Money once your balance reaches GHS {PAYOUT_MINIMUM_GHS}.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-center font-display text-2xl font-bold">Questions</h2>
        <div className="mt-8 divide-y divide-gh-black/10 dark:divide-white/10">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {item.q}
                <span className="text-gh-black/40 transition-transform group-open:rotate-45 dark:text-white/40">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-gh-black/50 dark:text-white/40">
          By joining you agree to the contributor terms in our{" "}
          <Link href="/terms#contributors" className="underline hover:text-gh-green">
            Terms of use
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
