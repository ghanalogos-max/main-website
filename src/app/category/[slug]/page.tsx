import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLogos, getCategories } from "@/lib/queries";
import { itemListJsonLd } from "@/lib/seo";
import Browser from "@/components/Browser";
import CategoryIcon from "@/components/CategoryIcon";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

// Categories added in Sanity after a deploy are rendered on first visit, then cached.
export const dynamicParams = true;
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const [logos, categories] = await Promise.all([getLogos(), getCategories()]);
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return {};
  const count = logos.filter((l) => l.categories?.includes(category.slug)).length;
  const title = `${category.title} Logos in Ghana — ${count} SVG & PNG Logos`;
  const description =
    category.description ??
    `Download ${count} official ${category.title.toLowerCase()} logos from Ghana in SVG and PNG.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { title, description, url: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const [logos, categories] = await Promise.all([getLogos(), getCategories()]);
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) notFound();

  const inCategory = logos.filter((l) => l.categories?.includes(category.slug));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={itemListJsonLd(`${category.title} logos`, inCategory)} />
      <Breadcrumbs
        items={[
          { name: "Categories", path: "/categories" },
          { name: category.title, path: `/category/${category.slug}` },
        ]}
      />
      <h1 className="mb-3 mt-5 flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gh-green/10 text-gh-green md:h-14 md:w-14 dark:bg-gh-gold/10 dark:text-gh-gold">
          <CategoryIcon slug={category.slug} size={28} />
        </span>
        {category.title} logos
      </h1>
      <p className="mb-8 max-w-2xl text-gh-black/60 dark:text-white/50">
        {category.description} {inCategory.length} logos available in SVG and PNG.
      </p>

      <Browser logos={logos} categories={categories} initialCategory={category.slug} />

      <section className="mt-16">
        <h2 className="mb-4 font-display text-xl font-bold">Other categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((c) => c.slug !== category.slug)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gh-black/10 bg-white/70 px-4 py-1.5 text-sm font-medium transition-colors hover:border-gh-green hover:text-gh-green dark:border-white/10 dark:bg-white/5 dark:hover:border-gh-gold dark:hover:text-gh-gold"
              >
                <CategoryIcon slug={c.slug} size={16} />
                {c.title}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
