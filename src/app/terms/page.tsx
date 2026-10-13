import type { Metadata } from "next";
import { FREE_DAILY_LIMIT } from "@/lib/plans";
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
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-gh-black dark:text-white">
            Removal requests
          </h2>
          <p>
            If you represent a brand and would like a logo updated or removed,
            email{" "}
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
