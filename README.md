# GhanaLogos

A free, open source library of high quality vector logos for Ghanaian
companies, banks, telecoms, government institutions, and organisations —
built by [Celestial Web Solutions](https://celestialwebsolutions.net).
Live at [ghanalogos.com](https://www.ghanalogos.com).

Inspired by [NigeriaLogos](https://nigerialogos.com).

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — themed with Ghana flag colours (`gh-red`, `gh-gold`,
  `gh-green`, `gh-black` — see `tailwind.config.ts`)
- **MingCute icons** via `@mingcute/react` (wrapped in
  `src/components/icons.tsx`)
- **Sanity CMS** — manages logo entries, categories, and contributor
  submissions
- **Paystack** — Premium payments in GHS (Mobile Money + cards)
- **Fuse.js** — client-side fuzzy search
- **Vercel** — hosting

## Logo data

Without Sanity, logos come from `src/data/logos.json` (files in
`public/logos/`) and categories from `src/data/categories.json`. The JSON is
generated from the brand list in `src/data/brands.json`:

```bash
node scripts/fetch-logos.mjs          # fetch logos for new brands only
node scripts/fetch-logos.mjs --force  # re-download everything
```

The script takes each brand's official logo from its Wikipedia infobox
(falling back to Wikidata), sanitises SVGs, extracts the brand colour, and
stores the Wikipedia description, source URL and licence with each logo.
Brands flagged `"skip": true` in `brands.json` are ignored — use this when
Wikipedia only has a photo or the wrong emblem, then add the official file
to `public/logos/` and an entry to `logos.json` by hand.

## Downloads & Premium

- Every download goes through `GET /api/download/[slug]`, which returns the
  original file (SVG, or PNG/JPG where no vector exists). For SVG logos, PNG
  exports (512 / 1024 / 2048 / 4096px) are rasterised in the browser from the
  SVG, so they're always crisp.
- Free visitors get **5 downloads per day** (`FREE_DAILY_LIMIT` in
  `src/lib/plans.ts`). Downloads, PNG exports and "copy SVG code" all count.
  The count lives in an HMAC-signed, httpOnly cookie, and — if Upstash Redis
  is configured — is also tracked per IP so clearing cookies doesn't reset it.
- 4K PNG export is Premium only.
- **Premium** is a one-off Paystack payment (monthly or yearly, prices set by
  env vars). After checkout Paystack redirects to `/api/paystack/verify`,
  which verifies the transaction server-side and sets a signed premium
  cookie. Users can restore Premium on another device at `/premium` using
  their Paystack reference — no database or user accounts needed.

Note: logo images are shown on the page for previews, so the limit is a
fair-use gate for the download experience, not DRM.

## Developer API

`/developers` sells API access; `/developers/docs` is the reference and
`/developers/dashboard` is where customers manage keys.

- **Plans** (`src/lib/apiPlans.ts`): Sandbox (free, non-commercial),
  Individual, Team and Organisation, each with a monthly request quota, a
  per-minute limit and a maximum number of keys. Monthly or yearly billing
  (yearly = 10 × monthly). Prices can be overridden with
  `NEXT_PUBLIC_API_*_GHS`.
- **Endpoints**: `GET /api/v1/logos`, `/api/v1/logos/{slug}`,
  `/api/v1/logos/{slug}/download`, `/api/v1/categories`, `/api/v1/usage`.
  Auth is `Authorization: Bearer gl_live_…`.
- **Storage**: accounts, hashed keys, payment references and usage counters
  live in **Upstash Redis**, which is **required in production** for the
  API. Without it the API returns 503. In development an in-memory store is
  used (set `API_STORE=memory` to force it under `next start` for testing —
  never in production, data is lost on restart).
- **Payments**: signed-in customers with a verified phone pay through
  Paystack checkout; `/api/developers/verify` applies the plan to their
  account (idempotent per reference). Renewing the same plan extends it;
  switching starts the new plan immediately. Expired plans fall back to
  Sandbox limits.

## Accounts & sign-in

Pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`. API routes
live under `/api/auth/*` (`src/lib/auth.ts`, `src/lib/developer.ts`).

- **Email sign-up**: name, email, phone, password and acceptance of the
  Terms and Privacy Policy. A 6-digit code is sent by email (Resend) and
  another by SMS (Arkesel); both must be entered before the account is
  created. Codes expire after 10 minutes, allow 5 attempts and can be resent
  once a minute (6 requests per IP per hour).
- **Continue with Google / GitHub**: shown only when the matching
  `*_CLIENT_ID` and `*_CLIENT_SECRET` are set. Only verified provider emails
  are accepted; signing in with a provider whose email matches an existing
  account links it to that account. Provider accounts verify their phone by
  SMS in the dashboard before creating API keys or buying a plan.
- **Passwords**: scrypt-hashed, at least 8 characters with a letter and a
  number. Failed sign-ins are limited to 8 per email and 30 per IP every
  15 minutes.
- **Forgot / reset password**: emails a single-use link valid for 1 hour.
  The response never reveals whether an account exists. Resetting signs out
  every other session.
- **Sign in with receipt number**: customers who forgot their password can
  sign in with their account email plus the reference from any Paystack
  receipt for an API plan (`/login?method=receipt`).
- **Sessions**: an HMAC-signed, httpOnly, `Secure` cookie (`gl_dev`, 90 days)
  carrying the account id and a session version.
- Without `RESEND_API_KEY` and `ARKESEL_API_KEY`, codes and reset links are
  printed to the server log and shown on screen in development only; in
  production email sign-up and password reset stay disabled until both are
  set (receipt and provider sign-in still work).

## Contributor programme

- Signed-in users add Mobile Money details at `/contributors/dashboard`, then
  submit logos at `/contribute`. Submissions land in Sanity as pending; the
  **Approve & publish** action in Studio creates the logo and links it to the
  contributor (`contributorId`).
- Each month 50% of Premium revenue forms a pool, split by each contributor's
  share of website downloads (once per visitor, per logo, per day; API and own
  downloads excluded). Counters live in Redis under `gl:pool:*`. Settings are
  in `src/lib/contributors.ts`.
- Paying out: copy `KV_REST_API_URL`/`KV_REST_API_TOKEN` from Vercel into
  `.env.local`, run `npm run payouts` for the CSV of balances of GHS 50 and up,
  send the Mobile Money payments, then run `npm run payouts -- --mark-paid`.

## Getting started

```bash
npm install
# create .env.local with the variables listed below (never commit it)
npm run dev
```

Visit `http://localhost:3000`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://www.ghanalogos.com` |
| `DOWNLOAD_SECRET` | **yes (prod)** | Signs quota/premium cookies. 32+ random bytes. |
| `PAYSTACK_SECRET_KEY` | for Premium | `sk_live_…` (or `sk_test_…` while testing) |
| `NEXT_PUBLIC_PREMIUM_MONTHLY_GHS` | no | Default `50` |
| `NEXT_PUBLIC_PREMIUM_YEARLY_GHS` | no | Default `400` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET` | for real logos | Sanity project |
| `SANITY_API_TOKEN` | for submissions | Editor token: saves logo submissions from `/contribute` and per-logo download counters |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | for the API | API accounts & keys; also per-IP daily limit |
| `RESEND_API_KEY` / `EMAIL_FROM` | for sign-up | Verification and password-reset emails via Resend |
| `ARKESEL_API_KEY` / `SMS_SENDER_ID` | for sign-up | Verification SMS via Arkesel |
| `GITHUB_CLIENT_ID` / `_SECRET` | no | "Continue with GitHub". Callback: `https://www.ghanalogos.com/api/auth/github/callback` |
| `GOOGLE_CLIENT_ID` / `_SECRET` | no | "Continue with Google". Redirect URI: `https://www.ghanalogos.com/api/auth/google/callback` |
| `NEXT_PUBLIC_API_INDIVIDUAL_GHS` / `_TEAM_GHS` / `_ORGANISATION_GHS` | no | Monthly API prices. Defaults `99` / `399` / `1199` |
| `NEXT_PUBLIC_GITHUB_URL` | no | Shows a GitHub link in the footer |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | no | Google Search Console HTML-tag code |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | no | Bing Webmaster Tools code |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploying to ghanalogos.com (Vercel)

1. Push this project to GitHub and import it at
   [vercel.com/new](https://vercel.com/new) (framework: Next.js, no changes
   needed).
2. In **Project → Settings → Environment Variables**, add the variables
   above (at minimum `NEXT_PUBLIC_SITE_URL`, `DOWNLOAD_SECRET`,
   `PAYSTACK_SECRET_KEY`). Redeploy.
3. In **Project → Settings → Domains**, add `ghanalogos.com` and
   `www.ghanalogos.com`.
4. At your domain registrar, set the DNS records Vercel shows. Usually:

   | Type | Name | Value |
   | --- | --- | --- |
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

   `www` is permanently redirected to the apex domain (see
   `next.config.js`). HTTPS certificates are issued automatically.
5. In the Paystack dashboard, no callback URL is needed — the app sends
   `https://www.ghanalogos.com/api/paystack/verify` with each transaction.
6. Verify the domain in Google Search Console and Bing Webmaster Tools (set
   the two `*_SITE_VERIFICATION` variables, redeploy), then submit
   `https://www.ghanalogos.com/sitemap.xml` in both.

## Setting up Sanity Studio

The schema files live in `sanity/schemaTypes/`. To spin up a Studio:

```bash
npm create sanity@latest -- --project <your-project-id> --dataset production --template clean --typescript
```

Then copy the contents of `sanity/schemaTypes/` into your new Studio project's
`schemaTypes/` folder and import them in `sanity.config.ts`.

Once connected, add your logos as `logo` documents (SVG preferred, PNG
fallback) and organise them under `category` documents. The homepage,
category pages, and individual logo pages will automatically pull from
Sanity instead of the local JSON.

## Project structure

```
src/
  app/
    page.tsx                    → homepage (hero + search + grid)
    categories/page.tsx         → all categories
    category/[slug]/page.tsx    → filtered by category
    logo/[slug]/page.tsx        → logo detail + download panel
    premium/page.tsx            → pricing, Paystack checkout, restore
    contribute/page.tsx         → logo submission form
    terms/page.tsx              → usage & trademarks
    sitemap.ts, robots.ts
    api/
      download/[slug]/route.ts  → gated SVG download
      quota/route.ts            → current quota / premium status
      paystack/initialize       → start checkout
      paystack/verify           → Paystack callback
      premium/restore           → restore Premium by reference
  components/
    DownloadProvider.tsx        → download/copy/PNG export + quota state
    UpgradeModal.tsx, QuotaBadge.tsx, PremiumClient.tsx
    Header.tsx, Footer.tsx, Browser.tsx, LogoCard.tsx, LogoDetail.tsx …
    icons.tsx                   → MingCute icon set
  lib/
    plans.ts                    → free limit, prices, PNG sizes
    quota.ts, signing.ts        → signed-cookie quota + premium
    paystack.ts                 → Paystack API
    rasterize.ts                → SVG → PNG in the browser
    seo.ts                      → site URL + JSON-LD helpers
    sanity.client.ts, queries.ts, types.ts
  data/                         → brands, categories, generated logos.json
scripts/
  fetch-logos.mjs               → builds logos.json from Wikipedia/Wikidata
sanity/
  schemaTypes/
```

## Branding

| Token      | Hex       |
| ---------- | --------- |
| `gh-red`   | `#CE1126` |
| `gh-gold`  | `#FCD116` |
| `gh-green` | `#006B3F` |
| `gh-black` | `#0A0A0A` |

Logo files: `public/logo-wordmark.svg` (full logo) and
`public/logo-mark.svg` (icon only, also used as favicon).

## License

MIT — same spirit as the NigeriaLogos project this is inspired by. Note:
individual company logos remain trademarks of their respective owners and
are provided for reference/design use only.
