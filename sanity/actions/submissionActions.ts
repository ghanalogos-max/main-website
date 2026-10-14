import { useState } from "react";
import { useClient, type DocumentActionComponent, type SanityDocument } from "sanity";
import { useRouter } from "sanity/router";
import { useToast } from "@sanity/ui";

const API_VERSION = "2024-01-01";

interface Submission extends SanityDocument {
  companyName?: string;
  submitterName?: string;
  sourceUrl?: string;
  status?: string;
  file?: { asset?: { _ref: string } };
}

interface Asset {
  url: string;
  extension?: string;
  mimeType?: string;
  originalFilename?: string;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "logo"
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export const ApproveSubmissionAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION });
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const doc = (props.draft || props.published) as Submission | null;
  const companyName = doc?.companyName?.trim();
  const assetRef = doc?.file?.asset?._ref;

  return {
    label: busy ? "Publishing…" : "Approve & publish",
    tone: "positive",
    disabled: busy || !companyName || !assetRef || doc?.status === "approved",
    title:
      doc?.status === "approved"
        ? "Already approved"
        : !companyName || !assetRef
          ? "Needs a company name and a file"
          : "Create a logo from this submission and mark it approved",
    onHandle: async () => {
      if (!companyName || !assetRef) return;
      setBusy(true);
      try {
        const asset = await client.fetch<Asset | null>(
          `*[_id == $id][0]{url, extension, mimeType, originalFilename}`,
          { id: assetRef }
        );
        if (!asset) throw new Error("The uploaded file could not be found.");

        const base = slugify(companyName);
        const existing = await client.fetch<{ _id: string; slug?: string }[]>(
          `*[string::startsWith(slug.current, $base) || string::startsWith(_id, "logo-" + $base) || string::startsWith(_id, "drafts.logo-" + $base)]{_id, "slug": slug.current}`,
          { base }
        );
        const taken = new Set(
          existing.flatMap((d) => [d.slug, d._id.replace(/^drafts\./, "").replace(/^logo-/, "")])
        );
        let slug = base;
        for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
        const logoId = `logo-${slug}`;

        const isSvg =
          asset.extension?.toLowerCase() === "svg" || asset.mimeType === "image/svg+xml";
        let artwork: Record<string, unknown>;
        if (isSvg) {
          artwork = { svgFile: { _type: "file", asset: { _type: "reference", _ref: assetRef } } };
        } else {
          // The submission is stored as a file asset; the logo's PNG field needs an image asset.
          const res = await fetch(asset.url);
          if (!res.ok) throw new Error("Couldn't download the submitted PNG.");
          const image = await client.assets.upload("image", await res.blob(), {
            filename: asset.originalFilename || `${slug}.png`,
          });
          artwork = { pngFile: { _type: "image", asset: { _type: "reference", _ref: image._id } } };
        }

        const approved = {
          status: "approved",
          logo: { _type: "reference", _ref: logoId, _weak: true },
        };
        const tx = client.transaction().create({
          _id: logoId,
          _type: "logo",
          name: companyName,
          slug: { _type: "slug", current: slug },
          ...artwork,
          sourceUrl: doc?.sourceUrl || undefined,
          sourceNote: `Community submission from ${doc?.submitterName || "a contributor"}`,
          featured: false,
          downloadCount: 0,
        });
        if (props.published) tx.patch(props.published._id, (p) => p.set(approved));
        if (props.draft) tx.patch(props.draft._id, (p) => p.set(approved));
        await tx.commit();

        toast.push({
          status: "success",
          title: `${companyName} is now live`,
          description: "Add categories, colour and a description to finish it off.",
        });
        props.onComplete();
        router.navigateIntent("edit", { id: logoId, type: "logo" });
      } catch (err) {
        toast.push({ status: "error", title: "Couldn't publish the logo", description: errorMessage(err) });
        setBusy(false);
      }
    },
  };
};

export const RejectSubmissionAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION });
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const doc = (props.draft || props.published) as Submission | null;

  return {
    label: "Reject",
    tone: "critical",
    disabled: busy || !doc || doc.status === "rejected" || doc.status === "approved",
    onHandle: async () => {
      setBusy(true);
      try {
        const tx = client.transaction();
        if (props.published) tx.patch(props.published._id, (p) => p.set({ status: "rejected" }));
        if (props.draft) tx.patch(props.draft._id, (p) => p.set({ status: "rejected" }));
        await tx.commit();
        toast.push({ status: "info", title: "Submission rejected" });
        props.onComplete();
      } catch (err) {
        toast.push({ status: "error", title: "Couldn't reject the submission", description: errorMessage(err) });
      }
      setBusy(false);
    },
  };
};
