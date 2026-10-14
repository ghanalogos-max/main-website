import { NextRequest, NextResponse } from "next/server";
import { getLogoBySlug } from "@/lib/queries";
import { getPremium, getUsage, recordDownload } from "@/lib/quota";
import { FREE_DAILY_LIMIT, PREMIUM_ONLY_SIZES } from "@/lib/plans";
import { incrementDownloadCount } from "@/lib/sanity.client";
import { MIME_TYPES } from "@/lib/types";
export const dynamic = "force-dynamic";

// Returns the master file. For SVG logos, PNG sizes are rasterised in the
// browser so they stay pixel perfect at any resolution; `size` is only used
// to gate premium-only export sizes.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const logo = await getLogoBySlug(params.slug);
  if (!logo) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const size = Number(req.nextUrl.searchParams.get("size")) || null;
  const premium = getPremium();

  if (!premium && size && PREMIUM_ONLY_SIZES.includes(size)) {
    return NextResponse.json({ error: "premium_required" }, { status: 402 });
  }

  let remaining: number | null = null;
  if (!premium) {
    if ((await getUsage()) >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "limit_reached", limit: FREE_DAILY_LIMIT },
        { status: 402 }
      );
    }
  }

  const source = await fetch(new URL(logo.imageUrl, req.nextUrl.origin), {
    cache: "no-store",
  });
  if (!source.ok) {
    return NextResponse.json({ error: "file_unavailable" }, { status: 502 });
  }
  const file = await source.arrayBuffer();

  if (!premium) {
    remaining = Math.max(0, FREE_DAILY_LIMIT - (await recordDownload()));
  }
  incrementDownloadCount(logo._id);
  return new NextResponse(file, {
    headers: {
      "Content-Type": MIME_TYPES[logo.format],
      "Content-Disposition": `attachment; filename="${logo.slug}-logo.${logo.format}"`,
      "Cache-Control": "no-store",
      "X-Downloads-Remaining": remaining === null ? "unlimited" : String(remaining),
    },
  });
}
