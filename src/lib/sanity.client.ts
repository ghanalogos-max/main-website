import { createClient } from "@sanity/client";

export const sanityEnabled = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
);

export const sanityClient = sanityEnabled
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2024-01-01",
      useCdn: true,
    })
  : null;

const writeClient =
  sanityEnabled && process.env.SANITY_API_TOKEN
    ? createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
        apiVersion: "2024-01-01",
        token: process.env.SANITY_API_TOKEN,
        useCdn: false,
      })
    : null;

export function incrementDownloadCount(id: string | undefined) {
  if (!writeClient || !id) return;
  writeClient
    .patch(id)
    .setIfMissing({ downloadCount: 0 })
    .inc({ downloadCount: 1 })
    .commit()
    .catch(() => {});
}
