import type { Metadata } from "next";
import { FREE_DAILY_LIMIT } from "@/lib/plans";
import { PAYOUT_MINIMUM_GHS, REWARD_BATCH, REWARD_GHS } from "@/lib/contributors";
import { PARENT_COMPANY, PARENT_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Usage & Trademarks",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        Usage &amp; trademarks
      </h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gh-black/70 dark:text-white/70">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-gh-black dark:text-white">
            Operator
          </h2>
          <p>
            GhanaLogos is owned and operated by{" "}
            <a href={PARENT_URL} target="_blank" rel="noopener" className="font-medium text-gh-green underline">
              {PARENT_COMPANY}
            </a>
            . The
            GhanaLogos name and mark are trademarks of {PARENT_COMPANY}.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-gh-black dark:text-white">
            Trademarks
          </h2>
          <p>
            All logos on GhanaLogos are trademarks of their respective owners.
            They are provided for identification, editorial and design
            reference purposes only. Using a logo does not imply endorsement by,
            or affiliation with, its owner. Always follow the owner&apos;s brand
            guidelines.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-gh-black dark:text-white">
            Downloads
          </h2>
          <p>
            Free visitors may download up to {FREE_DAILY_LIMIT} files per day.
            Premium purchases unlock unlimited downloads for the purchased
            period. Premium is a one-off payment and does not renew
            automatically. Payments are collected by {PARENT_COMPANY} through
            Paystack.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-gh-black dark:text-white">
            Accounts
          </h2>
          <p>
            You can create an account with your email and a password, or
            continue with Google or GitHub. You must give accurate details,
            including a phone number you control, and you are responsible for
            keeping your password, payment receipts and API keys secure and
            for activity under your account. You must be at least 13 years
            old to create an account. We may suspend accounts that break these
            terms.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-gh-black dark:text-white">
            Developer API
          </h2>
          <p>
            Sandbox API keys are for personal and non-commercial projects.
            Individual, Team and Organisation plans include commercial use
            within their request limits. API plans are one-off payments for
            30 or 365 days, collected by {PARENT_COMPANY} through Paystack,
            and do not renew automatically. You must keep your API keys
            secret and must not resell the logo dataset or use the API to
            build a competing logo library. We may suspend keys that abuse the
            service.
          </p>
        </section>
        <section id="contributors">
          <h2 className="mb-2 font-display text-lg font-bold text-gh-black dark:text-white">
            Contributor programme
          </h2>
          <p>
            Signed-in contributors may submit official logos of Ghanaian
            organisations. You must only submit the brand&apos;s own artwork,
            not altered or invented logos, and you confirm you obtained it from
            a public, official source. Submitting a logo does not transfer any
            ownership of it; the logo remains the trademark of its owner, and
            you grant {PARENT_COMPANY} permission to publish the file you
            uploaded.
          </p>
          <p className="mt-3">
            As a reward for the work of finding, checking and preparing
            official artwork, {PARENT_COMPANY} pays GHS {REWARD_GHS} for every{" "}
            {REWARD_BATCH} submissions it approves. The reward is a fixed
            payment for that service; it is not a share of any revenue and
            does not depend on how often a logo is viewed or downloaded.
            Rewards are paid by Mobile Money only to the verified phone number
            on your account, by the 10th of the month after your unpaid
            rewards reach GHS {PAYOUT_MINIMUM_GHS}. Any taxes due on rewards
            are your responsibility, and we may deduct tax where the law
            requires it.
          </p>
          <p className="mt-3">
            We decide which submissions to approve. We may remove any logo,
            for example at the brand owner&apos;s request; rewards already paid
            are not affected. We may withhold unpaid rewards and close
            accounts that submit altered, invented or unverified artwork, or
            that use more than one account. We may change the reward or these
            rules with 30 days&apos; notice; approvals made before a change keep
            the reward that applied when they were approved.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-gh-black dark:text-white">
            Removal requests
          </h2>
          <p>
            If you represent a brand and would like a logo updated or removed,{" "}
            <a href="/contact?topic=removal" className="font-medium text-gh-green underline">
              send us a removal request
            </a>{" "}
            or email{" "}
            <a href="mailto:hello@ghanalogos.com" className="font-medium text-gh-green underline">
              hello@ghanalogos.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
