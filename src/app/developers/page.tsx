import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import CodeBlock from "@/components/CodeBlock";
import DevelopersPricing from "@/components/DevelopersPricing";
import JsonLd from "@/components/JsonLd";
import { API_PLANS, ApiPlanId } from "@/lib/apiPlans";
import { getLogos } from "@/lib/queries";
import { SITE_URL, faqJsonLd } from "@/lib/seo";
import { BookIcon, BuildingIcon, ChartIcon, FlashIcon, KeyIcon, TerminalIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "GhanaLogos API — Ghanaian Company Logos for Developers",
  description:
    "A REST API for official logos of Ghanaian banks, telecoms, government agencies, universities and brands. SVG and PNG files, brand colours and metadata. Free Sandbox, Individual, Team and Organisation plans.",
  alternates: { canonical: "/developers" },
};

const PLAN_IDS: ApiPlanId[] = ["free", "individual", "team", "organisation"];

const COMPARISON: { label: string; value: (id: ApiPlanId) => string }[] = [
  { label: "Requests per month", value: (id) => API_PLANS[id].monthlyRequests.toLocaleString("en") },
  { label: "Requests per minute", value: (id) => API_PLANS[id].perMinute.toLocaleString("en") },
  { label: "API keys", value: (id) => String(API_PLANS[id].maxKeys) },
  { label: "Commercial use", value: (id) => (API_PLANS[id].commercial ? "Yes" : "Non-commercial only") },
  {
    label: "Logo requests",
    value: (id) =>
      id === "organisation" ? "Within 2 working days" : id === "team" ? "Within 5 working days" : "—",
  },
  { label: "Invoices", value: (id) => (id === "organisation" ? "Yes" : "Paystack receipt") },
  { label: "Support", value: (id) => API_PLANS[id].support },
];

const USE_CASES = [
  {
    icon: BuildingIcon,
    title: "Fintech & payments",
    body: "Show the right bank or mobile money logo in transfer forms, account pickers and receipts.",
  },
  {
    icon: BookIcon,
    title: "Newsrooms & CMS",
    body: "Pull official logos into articles, election coverage and sports tables automatically.",
  },
  {
    icon: ChartIcon,
    title: "Directories & dashboards",
    body: "Brand company listings, job boards, procurement tools and analytics with real logos.",
  },
];

const FAQS = [
  {
    q: "What does the GhanaLogos API return?",
    a: "Logo metadata — name, slug, categories, format, dimensions, brand colour, website, description and source licence — plus a URL to the original SVG or PNG file and an authenticated download endpoint.",
  },
  {
    q: "Which plan do I need?",
    a: "Sandbox is free for personal and non-commercial projects. Individual covers one developer shipping commercial work. Team adds more keys and requests for startups and agencies. Organisation is for high-volume production use with dedicated support and invoices.",
  },
  {
    q: "How do I pay, and does it renew automatically?",
    a: "Plans are paid once per month or year to Celestial Web Solutions through Paystack, with Mobile Money or card. Nothing renews automatically — renew from your dashboard before the plan ends. If a plan lapses, your keys keep working on Sandbox limits.",
  },
  {
    q: "What happens when I reach my limit?",
    a: "Requests beyond your per-minute or monthly limit return HTTP 429 with a Retry-After header. Monthly quotas reset on the first day of each month (UTC). Upgrade at any time from your dashboard.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. Buying a higher plan from your dashboard applies it to the same account and keys immediately. Renewing the same plan adds time to the end of your current period.",
  },
];

export default async function DevelopersPage() {
  const logos = await getLogos();
  const sample =
    logos.find((l) => l.slug === "ecobank-ghana") ??
    logos.find((l) => l.format === "svg") ??
    logos[0];

  const curl = `curl ${SITE_URL}/api/v1/logos?q=${encodeURIComponent(sample?.name.split(" ")[0].toLowerCase() ?? "mtn")} \\
  -H "Authorization: Bearer gl_live_your_key"`;

  const response = `{
  "data": [
    {
      "name": "${sample?.name}",
      "slug": "${sample?.slug}",
      "categories": ${JSON.stringify(sample?.categories ?? [])},
      "format": "${sample?.format}",
      "brand_color": ${sample?.brandColor ? `"${sample.brandColor}"` : "null"},
      "files": {
        "original": "${SITE_URL}${sample?.imageUrl}",
        "download": "${SITE_URL}/api/v1/logos/${sample?.slug}/download"
      }
    }
  ],
  "meta": { "page": 1, "per_page": 50, "total": 1, "total_pages": 1 }
}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JsonLd data={faqJsonLd(FAQS)} />
      <Breadcrumbs items={[{ name: "Developers", path: "/developers" }]} />

      <section className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <span className="eyebrow">
            <TerminalIcon size={14} />
            GhanaLogos API
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Ghanaian logos in your product, with one API call.
          </h1>
          <p className="mt-5 max-w-lg text-gh-black/60 md:text-lg dark:text-white/60">
            Search {logos.length} official logos of Ghanaian banks, telcos,
            government agencies, universities and brands. Get SVG and PNG
            files, brand colours and source details as clean JSON.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#pricing" className="btn-primary">
              <KeyIcon size={18} />
              Get an API key
            </a>
            <Link href="/developers/docs" className="btn-outline">
              <BookIcon size={18} />
              Read the docs
            </Link>
            <Link href="/developers/dashboard" className="btn-outline">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="grid gap-3">
          <CodeBlock label="Request" code={curl} />
          <CodeBlock label="Response" code={response} />
        </div>
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-3">
        {USE_CASES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="panel p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
              <Icon size={22} />
            </div>
            <h2 className="font-display font-bold">{title}</h2>
            <p className="mt-1.5 text-sm text-gh-black/60 dark:text-white/50">{body}</p>
          </div>
        ))}
      </section>

      <section id="pricing" className="mt-24 scroll-mt-24">
        <div className="text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Plans for individuals, teams and organisations
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gh-black/60 dark:text-white/50">
            Start free, upgrade when you ship. Pay once with Mobile Money or
            card — no automatic renewals.
          </p>
        </div>
        <div className="mt-10">
          <DevelopersPricing />
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-display text-2xl font-bold">Compare plans</h2>
        <div className="panel mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gh-black/10 dark:border-white/10">
                <th className="p-4 font-semibold text-gh-black/50 dark:text-white/40">Feature</th>
                {PLAN_IDS.map((id) => (
                  <th key={id} className="p-4 font-display font-bold">
                    {API_PLANS[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gh-black/5 dark:divide-white/5">
              {COMPARISON.map(({ label, value }) => (
                <tr key={label}>
                  <td className="p-4 font-medium">{label}</td>
                  {PLAN_IDS.map((id) => (
                    <td key={id} className="p-4 text-gh-black/70 dark:text-white/60">
                      {value(id)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-2">
        <div className="panel p-6">
          <FlashIcon size={22} className="text-gh-green dark:text-gh-gold" />
          <h2 className="mt-3 font-display text-lg font-bold">Built for production</h2>
          <p className="mt-1.5 text-sm text-gh-black/60 dark:text-white/50">
            JSON over HTTPS, CORS enabled, predictable errors, and rate-limit
            headers on every response so you always know where you stand.
          </p>
        </div>
        <div className="panel p-6">
          <KeyIcon size={22} className="text-gh-green dark:text-gh-gold" />
          <h2 className="mt-3 font-display text-lg font-bold">Keys you control</h2>
          <p className="mt-1.5 text-sm text-gh-black/60 dark:text-white/50">
            Create a key per app or environment, revoke compromised keys
            instantly, and track monthly usage from your dashboard.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-3xl">
        <h2 className="text-center font-display text-2xl font-bold md:text-3xl">
          API questions
        </h2>
        <div className="mt-8 divide-y divide-gh-black/10 dark:divide-white/10">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-gh-black/40 transition-transform group-open:rotate-45 dark:text-white/40">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-gh-black/60 dark:text-white/50">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
