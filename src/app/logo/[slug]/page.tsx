import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLogoBySlug, getLogos, getCategories } from "@/lib/queries";
import { FREE_DAILY_LIMIT } from "@/lib/plans";
import { faqJsonLd, logoImageJsonLd } from "@/lib/seo";
import type { LogoFormat } from "@/lib/types";
import LogoDetail from "@/components/LogoDetail";
import LogoGrid from "@/components/LogoGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryIcon from "@/components/CategoryIcon";
import JsonLd from "@/components/JsonLd";
import { LinkIcon, InfoIcon } from "@/components/icons";

export async function generateStaticParams() {
  const logos = await getLogos();
  return logos.map((l) => ({ slug: l.slug }));
}

// Logos added in Sanity after a deploy are rendered on first visit, then cached.
export const dynamicParams = true;
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const logo = await getLogoBySlug(params.slug);
  if (!logo) return {};

  const formats = logo.format === "svg" ? "SVG & PNG" : logo.format.toUpperCase();
  const title = `${logo.name} Logo ${formats} Download`;
  const description = `Download the official ${logo.name} logo in high quality ${formats}${
    logo.format === "svg" ? " vector" : ""
  } format. Transparent background, brand colour and usage notes — free on GhanaLogos.`;
  // Social platforms don't render SVG previews.
  const shareImage = logo.format === "svg" ? "/og.png" : logo.imageUrl;

  return {
    title,
    description,
    keywords: [
      `${logo.name} logo`,
      `${logo.name} logo png`,
      `${logo.name} logo svg`,
      `${logo.name} logo vector`,
      `${logo.name} logo download`,
    ],
    alternates: { canonical: `/logo/${logo.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/logo/${logo.slug}`,
      images: [shareImage],
    },
    twitter: {
      card: logo.format === "svg" ? "summary_large_image" : "summary",
      title,
      description,
      images: [shareImage],
    },
  };
}

function faqsFor(name: string, format: LogoFormat) {
  return [
    {
      q: `How do I download the ${name} logo?`,
      a:
        format === "svg"
          ? `Click "Download SVG" for the vector file, or choose a size under "Transparent PNG" to export a PNG. You can also copy the SVG code directly.`
          : `Click "Download ${format.toUpperCase()}" to save the highest quality ${format.toUpperCase()} file of the ${name} logo available.`,
    },
    {
      q: `Is the ${name} logo free to download?`,
      a: `Yes. Everyone can download up to ${FREE_DAILY_LIMIT} logos a day for free. GhanaLogos Premium gives unlimited downloads and 4K PNG exports.`,
    },
    {
      q: `Can I use the ${name} logo in my project?`,
      a: `The ${name} logo is a trademark of its owner. It may generally be used to refer to the organisation (for example in news articles, presentations or partner listings), but not in a way that suggests endorsement. Check the owner's brand guidelines for commercial use.`,
    },
  ];
}

export default async function LogoPage({
  params,
}: {
  params: { slug: string };
}) {
  const [logo, logos, categories] = await Promise.all([
    getLogoBySlug(params.slug),
    getLogos(),
    getCategories(),
  ]);
  if (!logo) notFound();

  const logoCategories = categories.filter((c) => logo.categories?.includes(c.slug));
  const primary = logoCategories[0];
  const related = logos
    .filter(
      (l) => l.slug !== logo.slug && l.categories?.some((c) => logo.categories?.includes(c))
    )
    .slice(0, 8);
  const faqs = faqsFor(logo.name, logo.format);

  const details: [string, React.ReactNode][] = [
    ["Format", logo.format === "svg" ? "SVG (vector) · PNG export" : "PNG (raster)"],
  ];
  if (logo.width && logo.height) {
    details.push([
      logo.format === "svg" ? "Artboard" : "Dimensions",
      `${Math.round(logo.width)} × ${Math.round(logo.height)}${logo.format !== "svg" ? "px" : ""}`,
    ]);
  }
  if (logo.brandColor) details.push(["Primary colour", <span key="c" className="font-mono uppercase">{logo.brandColor}</span>]);
  if (logoCategories.length) {
    details.push([
      "Category",
      <span key="cat" className="flex flex-wrap gap-x-2">
        {logoCategories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="inline-flex items-center gap-1 text-gh-green hover:underline dark:text-gh-gold">
            <CategoryIcon slug={c.slug} size={14} />
            {c.title}
          </Link>
        ))}
      </span>,
    ]);
  }
  if (logo.website) {
    details.push([
      "Official website",
      <a key="w" href={logo.website} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-gh-green hover:underline dark:text-gh-gold">
        {logo.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
      </a>,
    ]);
  }
  if (logo.sourceUrl) {
    details.push([
      "File source",
      <a key="s" href={logo.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-gh-green hover:underline dark:text-gh-gold">
        View source{logo.license ? ` (${logo.license})` : ""}
      </a>,
    ]);
  }
  if (logo.contributorName) {
    details.push([
      "Contributed by",
      <Link key="c" href="/contributors" className="text-gh-green hover:underline dark:text-gh-gold">
        {logo.contributorName}
      </Link>,
    ]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[logoImageJsonLd(logo), faqJsonLd(faqs)]} />

      <Breadcrumbs
        items={[
          ...(primary ? [{ name: primary.title, path: `/category/${primary.slug}` }] : []),
          { name: logo.name, path: `/logo/${logo.slug}` },
        ]}
      />

      <div className="mb-8 mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">
            {logo.name} Logo
          </h1>
          <p className="mt-2 text-gh-black/60 dark:text-white/50">
            Official {logo.name} logo in{" "}
            {logo.format === "svg" ? "vector SVG and transparent PNG" : `high resolution ${logo.format.toUpperCase()}`}{" "}
            format.
          </p>
        </div>
        {logo.website && (
          <a href={logo.website} target="_blank" rel="noopener noreferrer nofollow" className="btn-outline !py-2">
            <LinkIcon size={16} />
            Official website
          </a>
        )}
      </div>

      <LogoDetail logo={logo} />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="panel p-6">
          <h2 className="font-display text-xl font-bold">About {logo.name}</h2>
          {logo.description ? (
            <>
              <p className="mt-3 leading-relaxed text-gh-black/70 dark:text-white/70">
                {logo.description}
              </p>
              {logo.wikipediaUrl && (
                <p className="mt-3 text-xs text-gh-black/50 dark:text-white/40">
                  Description from{" "}
                  <a href={logo.wikipediaUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gh-green">
                    Wikipedia
                  </a>{" "}
                  (CC BY-SA 4.0).
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 leading-relaxed text-gh-black/70 dark:text-white/70">
              {logo.name} is listed in the {primary?.title ?? "GhanaLogos"} collection of
              official Ghanaian brand logos.
            </p>
          )}

          <h2 className="mt-8 font-display text-xl font-bold">Frequently asked questions</h2>
          <div className="mt-3 divide-y divide-gh-black/10 dark:divide-white/10">
            {faqs.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="text-gh-black/40 transition-transform group-open:rotate-45 dark:text-white/40">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-gh-black/60 dark:text-white/50">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="panel h-fit p-6">
          <h2 className="font-display text-xl font-bold">Logo details</h2>
          <dl className="mt-4 divide-y divide-gh-black/5 text-sm dark:divide-white/10">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-gh-black/50 dark:text-white/40">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-gh-black/50 dark:text-white/40">
        <InfoIcon size={14} className="mt-0.5 shrink-0" />
        The {logo.name} logo is a trademark of its owner and is shown here for
        identification and reference. GhanaLogos is not affiliated with{" "}
        {logo.name}.
      </p>

      {related.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold">
              More {primary ? primary.title.toLowerCase() : "related"} logos
            </h2>
            {primary && (
              <Link href={`/category/${primary.slug}`} className="text-sm font-semibold text-gh-green hover:underline dark:text-gh-gold">
                View all
              </Link>
            )}
          </div>
          <LogoGrid logos={related} />
        </section>
      )}
    </div>
  );
}
