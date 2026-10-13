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
  "format": select(defined(svgFile) => "svg", "png"),
  brandColor,
  website,
  featured,
  downloadCount,
  description,
  sourceUrl
}`;

const categoriesQuery = `*[_type == "category"] | order(order asc) {
  title,
  "slug": slug.current,
  order,
  description
}`;

export async function getLogos(): Promise<Logo[]> {
  if (!sanityEnabled || !sanityClient) return staticLogos;
  try {
    return await sanityClient.fetch(logosQuery);
  } catch {
    return staticLogos;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!sanityEnabled || !sanityClient) return staticCategories;
  try {
    return await sanityClient.fetch(categoriesQuery);
  } catch {
    return staticCategories;
  }
}

export async function getLogoBySlug(slug: string): Promise<Logo | undefined> {
  const logos = await getLogos();
  return logos.find((l) => l.slug === slug);
}
