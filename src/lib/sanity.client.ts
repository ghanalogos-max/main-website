import { randomUUID } from "crypto";
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

export const submissionsEnabled = Boolean(writeClient);

export interface SubmissionInput {
  companyName: string;
  submitterName: string;
  submitterEmail: string;
  sourceUrl?: string;
  file: File;
}

export async function createSubmission(input: SubmissionInput) {
  if (!writeClient) throw new Error("Sanity write token is not configured.");
  const asset = await writeClient.assets.upload(
    "file",
    Buffer.from(await input.file.arrayBuffer()),
    { filename: input.file.name, contentType: input.file.type || undefined }
  );
  const id = `submission-${randomUUID()}`;
  // The dataset is publicly readable; IDs under "private." need an authenticated
  // read, so the email lives there instead of on the submission itself.
  return writeClient
    .transaction()
    .create({
      _id: id,
      _type: "submission",
      companyName: input.companyName,
      submitterName: input.submitterName,
      sourceUrl: input.sourceUrl,
      file: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
      status: "pending",
      submittedAt: new Date().toISOString(),
    })
    .create({
      _id: privateContactId(id),
      _type: "submissionContact",
      email: input.submitterEmail,
    })
    .commit();
}

export function privateContactId(submissionId: string): string {
  return `private.${submissionId.replace(/^drafts\./, "")}`;
}

export function incrementDownloadCount(id: string | undefined) {
  if (!writeClient || !id) return;
  writeClient
    .patch(id)
    .setIfMissing({ downloadCount: 0 })
    .inc({ downloadCount: 1 })
    .commit()
    .catch(() => {});
}
