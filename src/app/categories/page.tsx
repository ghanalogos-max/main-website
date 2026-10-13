import Link from "next/link";
import type { Metadata } from "next";
import { getLogos, getCategories } from "@/lib/queries";
import { ArrowRightIcon, FolderIcon } from "@/components/icons";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Ghana Logos by Category — Banks, Telecom, Government & More",
  description:
    "Browse Ghanaian company logos by industry: banks, telecoms, government, insurance, education and more.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const [logos, categories] = await Promise.all([getLogos(), getCategories()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Breadcrumbs items={[{ name: "Categories", path: "/categories" }]} />
      <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
        Ghana logos by category
      </h1>
      <p className="mt-2 max-w-2xl text-gh-black/60 dark:text-white/50">
        {logos.length} official logos of Ghanaian organisations, grouped into{" "}
        {categories.length} industries and sectors.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const items = logos.filter((l) => l.categories?.includes(cat.slug));
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="panel group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-gh-green/40 hover:shadow-lift"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
                  <FolderIcon size={22} />
                </div>
                <ArrowRightIcon
                  size={18}
                  className="text-gh-black/30 transition-transform group-hover:translate-x-0.5 group-hover:text-gh-green dark:text-white/30"
                />
              </div>
              <h2 className="mt-4 font-display font-bold">{cat.title}</h2>
              {cat.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gh-black/50 dark:text-white/40">
                  {cat.description}
                </p>
              )}
              <p className="text-sm text-gh-black/50 dark:text-white/40">
                {items.length} logo{items.length === 1 ? "" : "s"}
              </p>
              {items.length > 0 && (
                <div className="mt-4 flex -space-x-2">
                  {items.slice(0, 5).map((l) => (
                    <span
                      key={l.slug}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white p-1.5 ring-2 ring-white dark:ring-ink-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.imageUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
