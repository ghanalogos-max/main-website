import { NextRequest } from "next/server";
import Fuse from "fuse.js";
import { getLogos } from "@/lib/queries";
import { apiError, apiJson, authenticate, preflight, serializeLogo } from "@/lib/api";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export async function GET(req: NextRequest) {
  const ctx = await authenticate(req);
  if (!("account" in ctx)) return ctx;

  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const category = params.get("category")?.trim();
  const sort = params.get("sort") ?? "featured";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const perPage = Math.min(100, Math.max(1, Number(params.get("per_page")) || 50));

  if (!["featured", "name"].includes(sort)) {
    return apiError(400, "invalid_parameter", "`sort` must be `featured` or `name`.", ctx.headers);
  }

  let logos = await getLogos();
  if (q) {
    logos = new Fuse(logos, { keys: ["name"], threshold: 0.35 })
      .search(q)
      .map((r) => r.item);
  } else if (sort === "name") {
    logos = [...logos].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (category) logos = logos.filter((l) => l.categories?.includes(category));

  const total = logos.length;
  const data = logos.slice((page - 1) * perPage, page * perPage).map(serializeLogo);

  return apiJson(
    {
      data,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.max(1, Math.ceil(total / perPage)),
      },
    },
    ctx
  );
}
