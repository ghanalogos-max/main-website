import type { Metadata } from "next";
import PremiumClient from "@/components/PremiumClient";
import { FREE_DAILY_LIMIT, PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Premium — Unlimited Logo Downloads",
  description: `Get unlimited SVG and PNG downloads of Ghanaian company logos, 4K exports and more. Free users get ${FREE_DAILY_LIMIT} downloads a day.`,
  alternates: { canonical: "/premium" },
};

const FAQ = [
  {
    q: "What do I get for free?",
    a: `Everyone gets ${FREE_DAILY_LIMIT} downloads per day (SVG, PNG up to 2048px, or copied SVG code). The count resets at midnight GMT.`,
  },
  {
    q: "How do I pay?",
    a: "Payments are made to Celestial Web Solutions, the company behind GhanaLogos, and processed securely by Paystack. You can pay with Mobile Money (MTN, Telecel, AirtelTigo) or a Visa/Mastercard card.",
  },
  {
    q: "Is it a subscription?",
    a: `No automatic renewals. You pay once for ${PLANS.monthly.days} or ${PLANS.yearly.days} days of Premium, and you can renew whenever you like.`,
  },
  {
    q: "How do I use Premium on another device?",
    a: "Use \"Restore purchase\" below and enter the payment reference from your Paystack receipt email.",
  },
];

export default function PremiumPage({
  searchParams,
}: {
  searchParams: { status?: string; message?: string };
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <PremiumClient status={searchParams.status} message={searchParams.message} />

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center font-display text-2xl font-bold">
          Frequently asked questions
        </h2>
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
      </section>
    </div>
  );
}
