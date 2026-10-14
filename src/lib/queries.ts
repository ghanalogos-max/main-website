import { sanityClient, sanityEnabled } from "./sanity.client";
import { Logo, Category, LogoFormat, MIME_TYPES } from "./types";
import localLogos from "@/data/logos.json";
import localCategories from "@/data/categories.json";

type LocalLogo = Omit<Logo, "imageUrl" | "format"> & {
  file: string;
  format: string;
};

const staticLogos: Logo[] = (localLogos as LocalLogo[])
  .map(({ file, format, ...rest }) => ({
    ...rest,
    imageUrl: file,
    format: (format in MIME_TYPES ? format : "png") as LogoFormat,
  }))
  .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

const staticCategories: Category[] = [...localCategories].sort(
  (a, b) => a.order - b.order
);

const logosQuery = `*[_type == "logo"] | order(featured desc, name asc) {
  _id,
  name,
  "slug": slug.current,
  "categories": categories[]->slug.current,
  "imageUrl": coalesce(svgFile.asset->url, pngFile.asset->url),
  "format": coalesce(svgFile.asset->extension, pngFile.asset->extension, "png"),
  width,
  height,
  brandColor,
  website,
  featured,
  downloadCount,
  description,
  sourceUrl,
  wikipediaUrl,
  license,
  contributorName
}`;

const categoriesQuery = `*[_type == "category"] | order(order asc) {
  title,
  "slug": slug.current,
  order,
  description
}`;

// Pages built from Sanity refresh at most every 5 minutes after content changes.
const REVALIDATE = { next: { revalidate: 300 } };

// An empty Sanity dataset falls back to the bundled logos so the site is never blank.
export async function getLogos(): Promise<Logo[]> {
  if (!sanityEnabled || !sanityClient) return staticLogos;
  try {
    const logos = await sanityClient.fetch<Logo[]>(logosQuery, {}, REVALIDATE);
    if (!logos?.length) return staticLogos;
    return logos
      .filter((l) => l.slug && l.imageUrl)
      .map((l) => ({
        ...l,
        categories: (l.categories ?? []).filter(Boolean),
        format: (l.format in MIME_TYPES ? l.format : "png") as LogoFormat,
      }));
  } catch {
    return staticLogos;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!sanityEnabled || !sanityClient) return staticCategories;
  try {
    const categories = await sanityClient.fetch<Category[]>(categoriesQuery, {}, REVALIDATE);
    return categories?.length ? categories : staticCategories;
  } catch {
    return staticCategories;
  }
}

export async function getLogoBySlug(slug: string): Promise<Logo | undefined> {
  const logos = await getLogos();
  return logos.find((l) => l.slug === slug);
}
