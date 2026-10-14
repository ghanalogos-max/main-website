import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import CodeBlock from "@/components/CodeBlock";
import { API_PLANS, ApiPlanId } from "@/lib/apiPlans";
import { SITE_URL } from "@/lib/seo";
import { serializeLogo } from "@/lib/api";
import { getLogoBySlug, getLogos } from "@/lib/queries";

export const metadata: Metadata = {
  title: "API Documentation — GhanaLogos API Reference",
  description:
    "Reference for the GhanaLogos REST API: authentication, endpoints for logos and categories, file downloads, rate limits, errors and code examples.",
  alternates: { canonical: "/developers/docs" },
};

const BASE = `${SITE_URL}/api/v1`;

const SECTIONS = [
  { id: "authentication", title: "Authentication" },
  { id: "limits", title: "Rate limits" },
  { id: "errors", title: "Errors" },
  { id: "list-logos", title: "List logos" },
  { id: "get-logo", title: "Get a logo" },
  { id: "download", title: "Download a file" },
  { id: "categories", title: "List categories" },
  { id: "usage", title: "Check usage" },
  { id: "examples", title: "Code examples" },
  { id: "licence", title: "Licence & attribution" },
];

const ERRORS = [
  ["400", "invalid_parameter", "A query parameter has an invalid value."],
  ["401", "missing_api_key", "No API key was sent."],
  ["401", "invalid_api_key", "The key is wrong or has been revoked."],
  ["403", "origin_not_allowed", "Browser request from a website the key isn't registered to."],
  ["404", "not_found", "No logo exists with that slug."],
  ["429", "rate_limited", "Per-minute limit exceeded. Wait for Retry-After seconds."],
  ["429", "quota_exceeded", "Monthly quota used up. Resets on the 1st (UTC) or upgrade."],
  ["503", "unavailable", "The API is temporarily unavailable."],
];

function Endpoint({ method, path }: { method: string; path: string }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm">
      <span className="rounded-md bg-gh-green px-2 py-0.5 text-xs font-bold text-white">{method}</span>
      <span className="break-all">{path}</span>
    </p>
  );
}

function Params({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="text-gh-black/50 dark:text-white/40">
          <tr className="border-b border-gh-black/10 dark:border-white/10">
            <th className="py-2 pr-4 font-medium">Parameter</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gh-black/5 dark:divide-white/5">
          {rows.map(([name, type, desc]) => (
            <tr key={name}>
              <td className="py-2 pr-4 font-mono text-xs">{name}</td>
              <td className="py-2 pr-4 text-gh-black/60 dark:text-white/50">{type}</td>
              <td className="py-2 text-gh-black/70 dark:text-white/60">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 pt-12 font-display text-2xl font-bold">
      {children}
    </h2>
  );
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 leading-relaxed text-gh-black/70 dark:text-white/70">{children}</p>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-gh-black/5 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-white/10">
    {children}
  </code>
);

export default async function DocsPage() {
  const plans: ApiPlanId[] = ["free", "individual", "team", "organisation"];
  const logo = (await getLogoBySlug("mtn-ghana")) ?? (await getLogos())[0];
  const sample = {
    ...serializeLogo(logo),
    description: logo.description ? `${logo.description.slice(0, 60)}…` : null,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Breadcrumbs
        items={[
          { name: "Developers", path: "/developers" },
          { name: "Docs", path: "/developers/docs" },
        ]}
      />
      <div className="mt-6 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-lg px-3 py-1.5 text-gh-black/60 hover:bg-gh-black/5 hover:text-gh-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        <article className="min-w-0 max-w-3xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">API documentation</h1>
          <P>
            The GhanaLogos API is a JSON REST API. All endpoints use{" "}
            <Code>GET</Code>, live under <Code>{BASE}</Code> and support CORS.
            Get a key from the{" "}
            <Link href="/account?tab=developer" className="font-semibold text-gh-green underline dark:text-gh-gold">
              developer dashboard
            </Link>
            .
          </P>

          <H2 id="authentication">Authentication</H2>
          <P>
            Send your key in the <Code>Authorization</Code> header as a bearer
            token. The <Code>X-API-Key</Code> header and an{" "}
            <Code>api_key</Code> query parameter are also accepted — use the
            query parameter only where headers are impossible, such as image
            tags, because URLs end up in logs.
          </P>
          <CodeBlock className="mt-4" label="Header" code={`Authorization: Bearer gl_live_your_key`} />
          <P>
            Every key is registered to one website when you create it — for
            example <Code>example.com</Code>, which also covers{" "}
            <Code>www.example.com</Code> and any other subdomain. Requests from
            a browser send an <Code>Origin</Code> or <Code>Referer</Code>{" "}
            header, and they are rejected with <Code>403 origin_not_allowed</Code>{" "}
            unless it matches that website (or <Code>localhost</Code>, if you
            enabled it for development). Use a separate key for each website.
          </P>
          <P>
            Requests from your own server don&apos;t send those headers and
            always work, so keep keys secret. Call the API from your server
            where possible; if a key leaks, revoke it from the dashboard and
            create a new one.
          </P>

          <H2 id="limits">Rate limits</H2>
          <P>
            Every request — including errors after authentication — counts
            toward a per-minute limit and a monthly quota that resets on the
            1st of each month (UTC).
          </P>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-gh-black/50 dark:text-white/40">
                <tr className="border-b border-gh-black/10 dark:border-white/10">
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Per minute</th>
                  <th className="py-2 pr-4 font-medium">Per month</th>
                  <th className="py-2 font-medium">Keys</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gh-black/5 dark:divide-white/5">
                {plans.map((id) => (
                  <tr key={id}>
                    <td className="py-2 pr-4 font-semibold">{API_PLANS[id].name}</td>
                    <td className="py-2 pr-4">{API_PLANS[id].perMinute.toLocaleString("en")}</td>
                    <td className="py-2 pr-4">{API_PLANS[id].monthlyRequests.toLocaleString("en")}</td>
                    <td className="py-2">{API_PLANS[id].maxKeys}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>Each response includes these headers:</P>
          <Params
            rows={[
              ["X-Plan", "string", "Your current plan."],
              ["X-RateLimit-Limit", "integer", "Monthly request quota."],
              ["X-RateLimit-Remaining", "integer", "Requests left this month."],
              ["X-RateLimit-Reset", "unix time", "When the monthly quota resets."],
              ["Retry-After", "seconds", "Sent with 429 responses."],
            ]}
          />

          <H2 id="errors">Errors</H2>
          <P>Errors use standard HTTP status codes and a consistent body:</P>
          <CodeBlock
            className="mt-4"
            label="Error response"
            code={`{
  "error": {
    "code": "invalid_api_key",
    "message": "This API key is invalid or has been revoked."
  }
}`}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <tbody className="divide-y divide-gh-black/5 dark:divide-white/5">
                {ERRORS.map(([status, code, desc]) => (
                  <tr key={code}>
                    <td className="py-2 pr-4 font-mono text-xs">{status}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{code}</td>
                    <td className="py-2 text-gh-black/70 dark:text-white/60">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="list-logos">List logos</H2>
          <Endpoint method="GET" path="/api/v1/logos" />
          <P>Returns logos, featured first by default.</P>
          <Params
            rows={[
              ["q", "string", "Search by company name (fuzzy)."],
              ["category", "string", "Category slug, e.g. banks-finance. See List categories."],
              ["sort", "string", "featured (default) or name. Ignored when q is set."],
              ["page", "integer", "Page number, starting at 1."],
              ["per_page", "integer", "Results per page, 1–100. Default 50."],
            ]}
          />
          <CodeBlock
            className="mt-4"
            label="Response"
            code={JSON.stringify(
              {
                data: [sample],
                meta: { page: 1, per_page: 50, total: 1, total_pages: 1 },
              },
              null,
              2
            )}
          />

          <H2 id="get-logo">Get a logo</H2>
          <Endpoint method="GET" path="/api/v1/logos/{slug}" />
          <P>
            Returns a single logo object in <Code>data</Code>, or{" "}
            <Code>404 not_found</Code>.
          </P>

          <H2 id="download">Download a file</H2>
          <Endpoint method="GET" path="/api/v1/logos/{slug}/download" />
          <P>
            Returns the original file (SVG where available, otherwise PNG or
            JPG) with the correct <Code>Content-Type</Code>. Add{" "}
            <Code>?disposition=inline</Code> to display it rather than download
            it.
          </P>

          <H2 id="categories">List categories</H2>
          <Endpoint method="GET" path="/api/v1/categories" />
          <CodeBlock
            className="mt-4"
            label="Response"
            code={`{
  "data": [
    {
      "slug": "banks-finance",
      "title": "Banks & Finance",
      "description": "…",
      "logo_count": 18,
      "page_url": "${SITE_URL}/category/banks-finance"
    }
  ]
}`}
          />

          <H2 id="usage">Check usage</H2>
          <Endpoint method="GET" path="/api/v1/usage" />
          <CodeBlock
            className="mt-4"
            label="Response"
            code={`{
  "data": {
    "plan": "team",
    "month": "2026-10",
    "requests_used": 1234,
    "requests_limit": 150000,
    "per_minute_limit": 300,
    "resets_at": "2026-11-01T00:00:00.000Z",
    "plan_expires_at": "2026-11-12T09:30:00.000Z"
  }
}`}
          />

          <H2 id="examples">Code examples</H2>
          <CodeBlock
            className="mt-4"
            label="cURL"
            code={`curl "${BASE}/logos?category=banks-finance&per_page=10" \\
  -H "Authorization: Bearer $GHANALOGOS_API_KEY"`}
          />
          <CodeBlock
            className="mt-4"
            label="JavaScript (Node 18+)"
            code={`const res = await fetch("${BASE}/logos?q=ecobank", {
  headers: { Authorization: \`Bearer \${process.env.GHANALOGOS_API_KEY}\` },
});
if (!res.ok) throw new Error((await res.json()).error.message);
const { data } = await res.json();
console.log(data[0].files.original);`}
          />
          <CodeBlock
            className="mt-4"
            label="Python"
            code={`import os, requests

res = requests.get(
    "${BASE}/logos/mtn-ghana",
    headers={"Authorization": f"Bearer {os.environ['GHANALOGOS_API_KEY']}"},
)
res.raise_for_status()
logo = res.json()["data"]
print(logo["name"], logo["brand_color"])`}
          />
          <CodeBlock
            className="mt-4"
            label="PHP"
            code={`$ch = curl_init("${BASE}/categories");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer " . getenv("GHANALOGOS_API_KEY")]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$categories = json_decode(curl_exec($ch), true)["data"];`}
          />

          <H2 id="licence">Licence &amp; attribution</H2>
          <P>
            Logos are trademarks of their owners and are provided for
            identification. Sandbox keys are for personal and non-commercial
            use; paid plans include commercial use. You may not resell the
            dataset or use the API to build a competing logo library. See the
            full{" "}
            <Link href="/terms" className="font-semibold text-gh-green underline dark:text-gh-gold">
              usage &amp; trademark terms
            </Link>
            .
          </P>
        </article>
      </div>
    </div>
  );
}
