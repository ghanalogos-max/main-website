import { NextRequest } from "next/server";
import { getLogoBySlug } from "@/lib/queries";
import { apiError, apiJson, authenticate, preflight, serializeLogo } from "@/lib/api";

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
  return apiJson({ data: serializeLogo(logo) }, ctx);
}
