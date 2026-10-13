import { NextRequest } from "next/server";
import { getLogoBySlug } from "@/lib/queries";
import { apiBinary, apiError, authenticate, preflight } from "@/lib/api";
import { MIME_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await authenticate(req);
  if (!("account" in ctx)) return ctx;

  const logo = await getLogoBySlug(params.slug);
  if (!logo) {
    return apiError(404, "not_found", `No logo with slug \`${params.slug}\`.`, ctx.headers);
  }

  const source = await fetch(new URL(logo.imageUrl, req.nextUrl.origin), {
    cache: "no-store",
  });
  if (!source.ok) {
    return apiError(502, "file_unavailable", "The logo file could not be loaded.", ctx.headers);
  }

  const inline = req.nextUrl.searchParams.get("disposition") === "inline";
  const filename = `${logo.slug}-logo.${logo.format}`;
  return apiBinary(await source.arrayBuffer(), ctx, {
    "Content-Type": MIME_TYPES[logo.format],
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
    "Cache-Control": "private, max-age=3600",
  });
}
