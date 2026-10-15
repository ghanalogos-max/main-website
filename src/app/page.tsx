import Link from "next/link";
import { getLogos, getCategories } from "@/lib/queries";
import { FREE_DAILY_LIMIT, PLANS } from "@/lib/plans";
import Browser from "@/components/Browser";
import CategoryIcon from "@/components/CategoryIcon";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";
import {
  CrownIcon,
  VectorIcon,
  ImageIcon,
  CopyIcon,
  UploadIcon,
  ArrowRightIcon,
  ShieldIcon,
} from "@/components/icons";

const FEATURES = [
  {
    icon: VectorIcon,
    title: "Vector SVG",
    body: "Infinitely scalable source files, ready for Figma, Illustrator and the web.",
  },
  {
    icon: ImageIcon,
    title: "PNG in any size",
    body: "Export crisp transparent PNGs at 512, 1024, 2048 — or 4K with Premium.",
  },
  {
    icon: CopyIcon,
    title: "Copy SVG code",
    body: "Paste logo markup straight into your code, slides or design tool.",
  },
  {
    icon: ShieldIcon,
    title: "Verified sources",
    body: "Every logo is reviewed against official brand assets before it's published.",
  },
];

const HOME_FAQS = [
  {
    q: "Where can I download Ghanaian company logos?",
    a: "GhanaLogos collects official logos of Ghanaian banks, telecoms, government agencies, universities, football clubs, media houses and brands. Search for a company, open its page and download the SVG or PNG.",
  },
  {
    q: "Are the logos in vector format?",
    a: "Wherever an official vector exists, logos are provided as SVG, and you can export transparent PNGs at 512, 1024, 2048 or 4096 pixels. Otherwise the highest quality raster file available is provided.",
  },
  {
    q: "Is GhanaLogos free?",
    a: `Yes. Everyone can download ${FREE_DAILY_LIMIT} logos per day for free. Premium unlocks unlimited downloads and 4K PNG exports for designers, agencies and newsrooms.`,
  },
  {
    q: "Where do the logos come from?",
    a: "Each logo is taken from an official source — the organisation's own published artwork as recorded on Wikipedia and Wikimedia Commons — and every logo page links to its source.",
  },
  {
    q: "Can a company request a logo update or removal?",
    a: "Yes. Brand owners can email hello@ghanalogos.com to update their logo or request removal.",
  },
];

export default async function HomePage() {
  const [logos, categories] = await Promise.all([getLogos(), getCategories()]);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 md:pt-20">
        <div className="max-w-3xl">
          <span className="eyebrow">The Ghana logo library</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Official logos of Ghanaian brands, in SVG &amp; PNG.
          </h1>
          <p className="mt-5 max-w-xl text-base text-gh-black/60 md:text-lg dark:text-white/60">
            Search and download high quality logos of Ghana&apos;s banks,
            telecoms, government agencies, universities, football clubs, media
            houses and brands.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gh-black/60 dark:text-white/50">
            <span>
              <strong className="text-gh-black dark:text-white">{logos.length}</strong>{" "}
              official logos
            </span>
            <span>
              <strong className="text-gh-black dark:text-white">{categories.length}</strong>{" "}
              categories
            </span>
            <span>
              <strong className="text-gh-black dark:text-white">{FREE_DAILY_LIMIT}</strong>{" "}
              free downloads daily
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <h2 className="sr-only">Search Ghanaian logos</h2>
        <Browser logos={logos} categories={categories} />
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Browse Ghana logos by category
            </h2>
            <p className="mt-1 text-gh-black/60 dark:text-white/50">
              From banks and telcos to universities and football clubs.
            </p>
          </div>
          <Link href="/categories" className="hidden text-sm font-semibold text-gh-green hover:underline sm:inline dark:text-gh-gold">
            All categories
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => {
            const count = logos.filter((l) => l.categories?.includes(c.slug)).length;
            return (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="panel group flex flex-col p-4 transition-all hover:-translate-y-0.5 hover:border-gh-green/40"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
                  <CategoryIcon slug={c.slug} size={18} />
                </span>
                <span className="font-display text-sm font-bold group-hover:text-gh-green dark:group-hover:text-gh-gold">
                  {c.title}
                </span>
                <span className="mt-0.5 text-xs text-gh-black/50 dark:text-white/40">
                  {count} logo{count === 1 ? "" : "s"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
                <Icon size={22} />
              </div>
              <h3 className="font-display font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-gh-black/60 dark:text-white/50">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4">
        <div className="rounded-3xl bg-gh-black px-8 py-12 text-white md:px-12">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gh-gold px-3 py-1 text-xs font-bold text-gh-black">
                <CrownIcon size={14} />
                GhanaLogos Premium
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
                Need more than {FREE_DAILY_LIMIT} logos a day?
              </h2>
              <p className="mt-3 max-w-lg text-white/70">
                Unlimited downloads, 4K PNG exports and unlimited SVG copying —
                built for agencies, designers, journalists and developers.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <p className="text-white/70">
                From{" "}
                <span className="font-display text-3xl font-extrabold text-white">
                  GH₵{PLANS.monthly.priceGhs}
                </span>{" "}
                / month
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/premium" className="btn-gold">
                  Go Premium
                  <ArrowRightIcon size={16} />
                </Link>
                <Link href="/contribute" className="btn border border-white/20 text-white hover:border-gh-gold hover:text-gh-gold">
                  <UploadIcon size={16} />
                  Contribute
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-3xl px-4">
        <JsonLd data={faqJsonLd(HOME_FAQS)} />
        <h2 className="text-center font-display text-2xl font-bold md:text-3xl">
          Questions about Ghana logos
        </h2>
        <div className="mt-8 divide-y divide-gh-black/10 dark:divide-white/10">
          {HOME_FAQS.map((f) => (
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
    </>
  );
}
