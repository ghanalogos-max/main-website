import { NextRequest } from "next/server";
import { getCategories, getLogos } from "@/lib/queries";
import { apiJson, authenticate, preflight } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export async function GET(req: NextRequest) {
  const ctx = await authenticate(req);
  if (!("account" in ctx)) return ctx;

  const [categories, logos] = await Promise.all([getCategories(), getLogos()]);
  const data = categories.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description ?? null,
    logo_count: logos.filter((l) => l.categories?.includes(c.slug)).length,
    page_url: absoluteUrl(`/category/${c.slug}`),
  }));
  return apiJson({ data }, ctx);
}
