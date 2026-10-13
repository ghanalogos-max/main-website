// Pulls the official logo for each brand in src/data/brands.json from the
// logo field of its Wikipedia infobox, saves it to public/logos/, and writes
// src/data/logos.json with source, licence and description metadata.
//
//   node scripts/fetch-logos.mjs            # fetch missing logos only
//   node scripts/fetch-logos.mjs --force    # re-download everything

import { readFile, writeFile, mkdir, access, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://en.wikipedia.org/w/api.php";
const UA = "GhanaLogosBot/1.0 (https://www.ghanalogos.com; hello@ghanalogos.com)";
const FORCE = process.argv.includes("--force");

const LOGO_FIELDS = ["logo", "image_logo", "logo_image", "badge", "crest", "emblem", "seal", "image"];

const MIME_EXT = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/gif": "gif",
};
const MIME_RANK = { "image/svg+xml": 0, "image/png": 1, "image/webp": 2, "image/jpeg": 3, "image/gif": 4 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return res.json();
      if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === 4) throw err;
    }
    await sleep(1500 * attempt);
  }
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function cleanFileValue(raw) {
  let v = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  const link = v.match(/\[\[\s*(?:File|Image)\s*:\s*([^|\]]+)/i);
  if (link) v = link[1];
  v = v.split("|")[0].replace(/^(File|Image)\s*:/i, "").trim();
  return /\.(svg|png|jpe?g|gif|webp)$/i.test(v) ? v : null;
}

function infoboxText(wikitext) {
  const start = wikitext.search(/\{\{\s*Infobox/i);
  if (start === -1) return "";
  let depth = 0;
  for (let i = start; i < wikitext.length - 1; i++) {
    if (wikitext[i] === "{" && wikitext[i + 1] === "{") { depth++; i++; }
    else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
      depth--; i++;
      if (depth === 0) return wikitext.slice(start, i + 1);
    }
  }
  return wikitext.slice(start, start + 6000);
}

function parseInfobox(wikitext) {
  const box = infoboxText(wikitext);
  const fields = {};
  for (const m of box.matchAll(/^\s*\|\s*([a-zA-Z_ ]+?)\s*=\s*(.*)$/gm)) {
    const key = m[1].toLowerCase().replace(/ /g, "_");
    if (!(key in fields)) fields[key] = m[2];
  }

  let file = null;
  for (const key of LOGO_FIELDS) {
    if (fields[key]) {
      file = cleanFileValue(fields[key]);
      if (file) break;
    }
  }

  let website = null;
  const w = fields.website || fields.url || "";
  const urlTpl = w.match(/\{\{\s*url\s*\|\s*([^|}]+)/i);
  const bracket = w.match(/\[(https?:\/\/[^\s\]]+)/i);
  const bare = w.match(/(https?:\/\/[^\s|}\]]+)/i);
  if (urlTpl) website = urlTpl[1].trim();
  else if (bracket) website = bracket[1];
  else if (bare) website = bare[1];
  if (website && !/^https?:\/\//.test(website)) website = `https://${website}`;

  return { file, website };
}

function sanitizeSvg(svg) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/(href\s*=\s*["'])\s*javascript:[^"']*/gi, "$1#");
}

function brandColor(svg) {
  const counts = new Map();
  for (const m of svg.matchAll(/(?:fill|stop-color|stroke)\s*[:=]\s*["']?\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b/g)) {
    let hex = m[1].toUpperCase();
    if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max > 235 && min > 235) continue; // near white
    if (max < 25) continue; // near black
    if (max - min < 12) continue; // greys
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function stripHtml(s) {
  return s ? s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : undefined;
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  // `skip: true` marks brands whose Wikipedia image is a photo or the wrong
  // emblem; add their official file by hand instead.
  const brands = JSON.parse(
    await readFile(path.join(ROOT, "src/data/brands.json"), "utf8")
  ).filter((b) => !b.skip);
  const outDir = path.join(ROOT, "public/logos");
  await mkdir(outDir, { recursive: true });

  // 1. Article wikitext + intro extract.
  const pages = new Map();
  for (const group of chunk(brands, 20)) {
    const data = await api({
      action: "query",
      titles: group.map((b) => b.wiki).join("|"),
      redirects: "1",
      prop: "revisions|extracts|info",
      rvprop: "content",
      rvslots: "main",
      exintro: "1",
      explaintext: "1",
      exsentences: "3",
      inprop: "url",
    });
    const alias = new Map();
    for (const n of data.query.normalized || []) alias.set(n.from, n.to);
    for (const r of data.query.redirects || []) alias.set(r.from, r.to);
    const byTitle = new Map(data.query.pages.map((p) => [p.title, p]));
    for (const b of group) {
      let t = b.wiki;
      for (let i = 0; i < 3 && alias.has(t); i++) t = alias.get(t);
      pages.set(b.wiki, byTitle.get(t));
    }
    await sleep(300);
  }

  // 1b. Search for articles whose title in brands.json didn't resolve.
  for (const b of brands) {
    const page = pages.get(b.wiki);
    if (page && !page.missing) continue;
    const data = await api({ action: "query", list: "search", srsearch: `${b.name} Ghana`, srlimit: "3" });
    const words = b.name.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && w !== "ghana");
    const hit = data.query.search.find((s) => words.every((w) => s.title.toLowerCase().includes(w)));
    if (hit) {
      const res = await api({
        action: "query", titles: hit.title, redirects: "1",
        prop: "revisions|extracts|info", rvprop: "content", rvslots: "main",
        exintro: "1", explaintext: "1", exsentences: "3", inprop: "url",
      });
      pages.set(b.wiki, res.query.pages[0]);
    }
    await sleep(200);
  }

  // 2. Wikidata logo (P154), coat of arms (P94), seal (P158) and website (P856).
  const qids = new Map();
  const titles = [...new Set([...pages.values()].filter((p) => p && !p.missing).map((p) => p.title))];
  for (const group of chunk(titles, 50)) {
    const data = await api({ action: "query", titles: group.join("|"), prop: "pageprops", ppprop: "wikibase_item" });
    for (const p of data.query.pages) if (p.pageprops?.wikibase_item) qids.set(p.title, p.pageprops.wikibase_item);
    await sleep(200);
  }
  const wikidata = new Map();
  for (const group of chunk([...new Set(qids.values())], 50)) {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: "wbgetentities", ids: group.join("|"), props: "claims", format: "json" })}`,
      { headers: { "User-Agent": UA } }
    );
    const data = await res.json();
    for (const [id, entity] of Object.entries(data.entities || {})) {
      const claim = (prop) => entity.claims?.[prop]?.find((c) => c.rank !== "deprecated")?.mainsnak?.datavalue?.value;
      wikidata.set(id, {
        files: ["P154", "P94", "P158"].map(claim).filter(Boolean),
        website: claim("P856"),
      });
    }
    await sleep(200);
  }

  const resolved = brands.map((b) => {
    const page = pages.get(b.wiki);
    if (!page || page.missing) return { brand: b, error: "article not found" };
    const wikitext = page.revisions?.[0]?.slots?.main?.content || "";
    const box = parseInfobox(wikitext);
    const wd = wikidata.get(qids.get(page.title)) || { files: [] };
    const candidates = [...new Set([box.file, ...wd.files].filter(Boolean))];
    return {
      brand: b,
      page,
      candidates,
      website: b.website || box.website || wd.website,
      error: candidates.length ? null : "no logo on Wikipedia or Wikidata",
    };
  });

  // 3. File info (URL, mime, licence).
  const files = [...new Set(resolved.flatMap((r) => (r.candidates || []).map((f) => `File:${f}`)))];
  const info = new Map();
  for (const group of chunk(files, 40)) {
    const data = await api({
      action: "query",
      titles: group.join("|"),
      prop: "imageinfo",
      iiprop: "url|mime|size|extmetadata",
      iiextmetadatafilter: "LicenseShortName|Credit|Artist",
    });
    const alias = new Map((data.query.normalized || []).map((n) => [n.to, n.from]));
    for (const p of data.query.pages) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const entry = {
        url: ii.url,
        mime: ii.mime,
        width: ii.width,
        height: ii.height,
        descriptionUrl: ii.descriptionurl,
        license: stripHtml(ii.extmetadata?.LicenseShortName?.value),
      };
      info.set(p.title, entry);
      if (alias.has(p.title)) info.set(alias.get(p.title), entry);
    }
    await sleep(300);
  }

  // 4. Download.
  const logos = [];
  const failures = [];
  for (const r of resolved) {
    const { brand } = r;
    const slug = brand.slug || slugify(brand.name);
    if (r.error) { failures.push(`${brand.name}: ${r.error}`); continue; }

    const lookup = (f) => info.get(`File:${f}`) || info.get(`File:${f.replace(/_/g, " ")}`);
    const options = r.candidates.map(lookup).filter((fi) => fi && MIME_EXT[fi.mime]);
    options.sort((a, b) => MIME_RANK[a.mime] - MIME_RANK[b.mime]);
    const fi = options[0];
    if (!fi) { failures.push(`${brand.name}: no usable file (${r.candidates.join(", ")})`); continue; }

    const isSvg = fi.mime === "image/svg+xml";
    const ext = MIME_EXT[fi.mime];
    const dest = path.join(outDir, `${slug}.${ext}`);
    let color;
    if (FORCE || !(await exists(dest))) {
      try {
        const res = await fetch(fi.url, { headers: { "User-Agent": UA } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (isSvg) {
          const svg = sanitizeSvg(await res.text());
          color = brandColor(svg);
          await writeFile(dest, svg);
        } else {
          await writeFile(dest, Buffer.from(await res.arrayBuffer()));
        }
        process.stdout.write(`✓ ${brand.name} (${ext})\n`);
      } catch (err) {
        failures.push(`${brand.name}: download failed (${err.message})`);
        continue;
      }
      await sleep(250);
    } else if (isSvg) {
      color = brandColor(await readFile(dest, "utf8"));
    }

    logos.push({
      name: brand.name,
      slug,
      categories: brand.categories,
      featured: brand.featured || undefined,
      file: `/logos/${slug}.${ext}`,
      format: ext,
      width: fi.width,
      height: fi.height,
      brandColor: brand.brandColor || color,
      website: r.website || undefined,
      description: r.page.extract?.trim() || undefined,
      wikipediaUrl: r.page.fullurl,
      sourceUrl: fi.descriptionUrl,
      license: fi.license,
    });
  }

  const keep = new Set(logos.map((l) => path.basename(l.file)));
  for (const f of await readdir(outDir)) {
    if (!keep.has(f)) await unlink(path.join(outDir, f));
  }

  logos.sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(path.join(ROOT, "src/data/logos.json"), JSON.stringify(logos, null, 2) + "\n");

  console.log(`\n${logos.length} logos written to src/data/logos.json`);
  console.log(`  ${logos.filter((l) => l.format === "svg").length} SVG, ${logos.filter((l) => l.format === "png").length} PNG`);
  if (failures.length) {
    console.log(`\n${failures.length} skipped:`);
    for (const f of failures) console.log(`  - ${f}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
