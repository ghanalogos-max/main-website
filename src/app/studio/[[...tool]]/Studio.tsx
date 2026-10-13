"use client";

import { NextStudio } from "next-sanity/studio";
import config, { projectId } from "../../../../sanity.config";

// Covers the site header and footer from the root layout.
export default function Studio() {
  if (!projectId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Sanity Studio isn&apos;t configured</h1>
        <p className="mt-3 text-sm text-gh-black/60 dark:text-white/50">
          Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> (and optionally{" "}
          <code>NEXT_PUBLIC_SANITY_DATASET</code>) and redeploy.
        </p>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-[200] bg-white">
      <NextStudio config={config} />
    </div>
  );
}
