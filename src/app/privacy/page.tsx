import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GhanaLogos handles cookies, payments and personal data.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "What we collect",
    body: "We don't require an account. To enforce the free daily download limit we store a small signed cookie containing the date and the number of downloads you've made today. If configured, we also keep a temporary per-IP counter that expires within 26 hours.",
  },
  {
    title: "Payments",
    body: "Premium payments are collected by Celestial Web Solutions, the company behind GhanaLogos, through Paystack. We never see or store your card or Mobile Money details. After payment we store a signed cookie containing your email, plan and expiry date so Premium works on your device.",
  },
  {
    title: "Accounts",
    body: "When you create an account we store your name, email, phone number, organisation, plan, payment references and monthly API request counts. We verify your email address and phone number with one-time codes sent through our email and SMS providers. Passwords are stored only as salted one-way hashes. If you continue with Google or GitHub, we receive your name, verified email address and account ID from that provider — nothing else, and we never post on your behalf. API keys are also stored only as one-way hashes, so we can't recover a lost key — revoke it and create a new one.",
  },
  {
    title: "Cookies",
    body: "We use essential cookies for your download quota, Premium status, keeping you signed in, a short-lived one while you sign in with Google or GitHub, and a local setting for light/dark mode. We also use Google Analytics to understand which pages and logos are popular; it sets its own cookies and collects anonymous usage data such as pages visited, device type and approximate location. You can opt out with Google's Analytics opt-out browser add-on. We do not use advertising cookies.",
  },
  {
    title: "Contact",
    body: "Questions about privacy? Email hello@ghanalogos.com.",
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs items={[{ name: "Privacy policy", path: "/privacy" }]} />
      <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight">Privacy policy</h1>
      <div className="mt-8 space-y-7">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-xl font-bold">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-gh-black/70 dark:text-white/70">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
