// Copies the bundled logos and categories (src/data/*.json + public/logos) into Sanity.
// Safe to run again: documents use fixed IDs, unchanged files aren't re-uploaded
// (Sanity de-duplicates assets), and existing download counts are kept.
//
// Needs NEXT_PUBLIC_SANITY_PROJECT_ID and a SANITY_API_TOKEN with Editor access:
//   npm run sanity:import
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error(
    "Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN (Editor permission) in .env.local first."
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, token, apiVersion: "2024-01-01", useCdn: false });

const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const categories = await readJson("src/data/categories.json");
const logos = await readJson("src/data/logos.json");

const CONTENT_TYPES = {
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  gif: "image/gif",
};
const ref = (id) => ({ _type: "reference", _ref: id });
const slug = (current) => ({ _type: "slug", current });

console.log(`Importing ${categories.length} categories and ${logos.length} logos into ${projectId}/${dataset}…`);

const tx = client.transaction();
for (const c of categories) {
  tx.createOrReplace({
    _id: `category-${c.slug}`,
    _type: "category",
    title: c.title,
    slug: slug(c.slug),
    order: c.order,
    description: c.description,
  });
}
await tx.commit();
console.log(`✓ ${categories.length} categories`);

let done = 0;
const failed = [];
for (const l of logos) {
  try {
    const ext = path.extname(l.file).slice(1).toLowerCase();
    const isSvg = ext === "svg";
    const buffer = await readFile(path.join(root, "public", l.file));
    const asset = await client.assets.upload(isSvg ? "file" : "image", buffer, {
      filename: path.basename(l.file),
      contentType: CONTENT_TYPES[ext] || "application/octet-stream",
    });

    const id = `logo-${l.slug}`;
    const fields = {
      name: l.name,
      slug: slug(l.slug),
      categories: (l.categories || []).map((c) => ({ ...ref(`category-${c}`), _key: c })),
      featured: Boolean(l.featured),
      width: l.width,
      height: l.height,
      brandColor: l.brandColor,
      website: l.website,
      description: l.description,
      sourceUrl: l.sourceUrl,
      wikipediaUrl: l.wikipediaUrl,
      license: l.license,
      [isSvg ? "svgFile" : "pngFile"]: { _type: isSvg ? "file" : "image", asset: ref(asset._id) },
    };
    const unset = [isSvg ? "pngFile" : "svgFile"];
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) {
        delete fields[key];
        unset.push(key);
      }
    }

    await client
      .transaction()
      .createIfNotExists({ _id: id, _type: "logo", downloadCount: 0 })
      .patch(id, (p) => p.set(fields).unset(unset))
      .commit();
    done += 1;
    process.stdout.write(`\r✓ ${done}/${logos.length} logos`);
  } catch (err) {
    failed.push(`${l.slug}: ${err.message}`);
  }
}

console.log(`\nDone: ${done} imported, ${failed.length} failed.`);
if (failed.length) {
  console.log(failed.map((f) => `  ✗ ${f}`).join("\n"));
  process.exit(1);
}
