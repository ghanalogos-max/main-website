import Link from "next/link";
import type { Metadata } from "next";
import { getLogos, getCategories } from "@/lib/queries";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PARENT_COMPANY, PARENT_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About GhanaLogos",
  description: `GhanaLogos, a product of ${PARENT_COMPANY}, is the reference library of official Ghanaian brand logos for designers, developers, journalists and businesses.`,
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [logos, categories] = await Promise.all([getLogos(), getCategories()]);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight">
        About GhanaLogos
      </h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-gh-black/70 dark:text-white/70">
        <p>
          GhanaLogos is a searchable library of official logos of Ghanaian
          organisations — {logos.length} logos across {categories.length}{" "}
          categories, from banks and telecoms to universities, government
          agencies, media houses and football clubs.
        </p>
        <p>
          Designers, developers, journalists, event organisers and students
          regularly need a clean, correct logo of a Ghanaian company. Too
          often that means screenshots, blurry JPEGs or outdated artwork.
          GhanaLogos gives you the official file in the best format available,
          with its brand colour and a link to where it came from.
        </p>
        <h2 className="pt-4 font-display text-2xl font-bold text-gh-black dark:text-white">
          Who runs GhanaLogos
        </h2>
        <p>
          GhanaLogos is owned and operated by{" "}
          <a
            href={PARENT_URL}
            target="_blank"
            rel="noopener"
            className="font-semibold text-gh-green underline dark:text-gh-gold"
          >
            {PARENT_COMPANY}
          </a>
          , and the
          GhanaLogos name and mark are trademarks of {PARENT_COMPANY}.
          Premium payments are collected by {PARENT_COMPANY} through
          Paystack, so your receipt will show {PARENT_COMPANY} as the
          merchant.
        </p>
        <h2 className="pt-4 font-display text-2xl font-bold text-gh-black dark:text-white">
          Where the logos come from
        </h2>
        <p>
          Every logo is sourced from the organisation&apos;s published artwork
          as recorded on Wikipedia, Wikimedia Commons and Wikidata, or supplied
          directly by the brand. Each logo page links to its source so you can
          verify it.
        </p>
        <h2 className="pt-4 font-display text-2xl font-bold text-gh-black dark:text-white">
          For brand owners
        </h2>
        <p>
          If you manage a brand listed here and want to supply an updated logo
          or request removal, email{" "}
          <a href="mailto:hello@ghanalogos.com" className="font-semibold text-gh-green underline dark:text-gh-gold">
            hello@ghanalogos.com
          </a>
          . See our{" "}
          <Link href="/terms" className="font-semibold text-gh-green underline dark:text-gh-gold">
            usage &amp; trademark policy
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
