import type { Metadata } from "next";
import Link from "next/link";
import {
  ChartIcon,
  PhoneIcon,
  ShieldIcon,
  UploadIcon,
  UserIcon,
} from "@/components/icons";
import { PAYOUT_MINIMUM_GHS, REWARD_BATCH, REWARD_GHS } from "@/lib/contributors";
import { sessionName } from "@/lib/developer";

const REWARD = `GHS ${REWARD_GHS}`;

export const metadata: Metadata = {
  title: "Contributor Programme — Get Rewarded for Adding Logos",
  description: `Find and submit official Ghanaian brand logos to GhanaLogos and earn ${REWARD} for every ${REWARD_BATCH} approved logos, paid by Mobile Money.`,
  alternates: { canonical: "/contributors" },
};

const STEPS = [
  {
    icon: UserIcon,
    title: "Create an account",
    text: "Sign up free and verify the phone number on your Mobile Money wallet.",
  },
  {
    icon: UploadIcon,
    title: "Submit official logos",
    text: "Find the brand's own SVG or PNG artwork from its website or guidelines.",
  },
  {
    icon: ShieldIcon,
    title: "We review it",
    text: "Our team checks every logo. Approved logos go live with your name on them.",
  },
  {
    icon: PhoneIcon,
    title: "Get rewarded",
    text: `Every ${REWARD_BATCH} approved logos earns you ${REWARD}, sent by Mobile Money.`,
  },
];

const FAQ = [
  {
    q: "How much do I earn?",
    a: `${REWARD} for every ${REWARD_BATCH} logos we approve. Your dashboard shows how many more approved logos you need for the next reward. Pending and rejected submissions don't count.`,
  },
  {
    q: "What am I being paid for?",
    a: "For your work finding, checking and preparing the official artwork. It's a fixed reward per batch of approved logos and doesn't depend on how often a logo is downloaded.",
  },
  {
    q: "When and how do I get paid?",
    a: `By Mobile Money (MTN MoMo, Telecel Cash or AT Money) to the verified phone number on your account. Once your unpaid rewards reach GHS ${PAYOUT_MINIMUM_GHS}, they're paid by the 10th of the following month.`,
  },
  {
    q: "Is there a fee to join?",
    a: "No. You only need a free GhanaLogos account and a Mobile Money wallet registered to your verified phone number.",
  },
  {
    q: "What logos can I submit?",
    a: "Official logos of Ghanaian companies, organisations and institutions that aren't already in the library. Use the brand's own artwork; don't redraw, edit or invent a logo. Duplicates of existing logos aren't accepted.",
  },
  {
    q: "Do I own the logo once it's approved?",
    a: "No. Logos remain the trademarks of their owners. If a brand owner asks us to remove a logo, we will — rewards you've already been paid aren't affected.",
  },
  {
    q: "What happens if someone cheats?",
    a: "Altered or invented logos, artwork copied from other logo sites without checking it's official, or several accounts per person lead to rewards being withheld and the account being removed from the programme.",
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
          Get rewarded for growing Ghana&apos;s logo library
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-gh-black/60 dark:text-white/50">
          Find official logos of Ghanaian brands that are missing from GhanaLogos. For every{" "}
          {REWARD_BATCH} we approve, we send {REWARD} to your Mobile Money wallet, and your
          name appears on each logo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {signedIn ? (
            <>
              <Link href="/contribute" className="btn-primary">
                <UploadIcon size={16} />
                Submit a logo
              </Link>
              <Link href="/account?tab=contributions" className="btn-dark">
                My contributions
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup?next=%2Faccount%3Ftab%3Dcontributions" className="btn-primary">
                Join for free
              </Link>
              <Link href="/login?next=%2Faccount%3Ftab%3Dcontributions" className="btn-dark">
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
