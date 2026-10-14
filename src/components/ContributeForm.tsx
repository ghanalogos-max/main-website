"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, LoadingIcon, UploadIcon } from "@/components/icons";

export default function ContributeForm({ name }: { name: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="panel flex flex-col items-center p-8 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gh-green/10 text-gh-green">
          <CheckIcon size={28} />
        </div>
        <h2 className="font-display text-2xl font-bold">Thank you! 🇬🇭</h2>
        <p className="mt-2 text-gh-black/60 dark:text-white/50">
          Your logo has been received and will be reviewed before it&apos;s published.
          You can follow its status on your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/account?tab=contributions" className="btn-dark">
            My contributions
          </Link>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setFileName(null);
              setStatus("idle");
            }}
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="panel flex flex-col gap-4 p-6">
      <p className="text-sm text-gh-black/60 dark:text-white/50">
        Submitting as <span className="font-semibold text-gh-black dark:text-white">{name}</span>
      </p>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Company name</label>
        <input required name="companyName" maxLength={120} type="text" className="input" placeholder="e.g. Ghana Commercial Bank" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Source link <span className="font-normal text-gh-black/40 dark:text-white/40">(where you got the official logo)</span>
        </label>
        <input name="sourceUrl" maxLength={500} type="url" className="input" placeholder="https://brand-website.com.gh/press" />
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gh-black/15 px-4 py-8 text-center transition-colors hover:border-gh-green dark:border-white/15">
        <UploadIcon size={26} className="text-gh-green dark:text-gh-gold" />
        <span className="text-sm font-semibold">{fileName ?? "Upload logo file"}</span>
        <span className="text-xs text-gh-black/50 dark:text-white/40">SVG or PNG, up to 5MB</span>
        <input
          required
          name="file"
          type="file"
          accept=".svg,.png"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={status === "submitting"} className="btn-primary mt-1">
        {status === "submitting" ? (
          <LoadingIcon size={16} className="animate-spin" />
        ) : (
          <UploadIcon size={16} />
        )}
        {status === "submitting" ? "Submitting..." : "Submit logo"}
      </button>
    </form>
  );
}
