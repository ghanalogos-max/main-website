"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UploadIcon,
  CheckIcon,
  LoadingIcon,
  VectorIcon,
  ShieldIcon,
  HeartIcon,
} from "@/components/icons";

const STEPS = [
  { icon: VectorIcon, text: "SVG preferred — official artwork from the brand's website or guidelines." },
  { icon: ShieldIcon, text: "Our team verifies every submission before it goes live." },
  { icon: HeartIcon, text: "Contributors are credited on the logo page." },
];

export default function ContributePage() {
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
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gh-green/10 text-gh-green">
          <CheckIcon size={28} />
        </div>
        <h1 className="font-display text-2xl font-bold">Thank you! 🇬🇭</h1>
        <p className="mt-2 text-gh-black/60 dark:text-white/50">
          Your logo submission has been received and will be reviewed before
          being published.
        </p>
        <Link href="/" className="btn-dark mt-6">
          Back to the library
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.2fr]">
      <div>
        <span className="eyebrow">
          <UploadIcon size={14} />
          Contribute
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          Help grow Ghana&apos;s logo library
        </h1>
        <p className="mt-3 text-gh-black/60 dark:text-white/50">
          Know a Ghanaian brand that&apos;s missing? Submit its logo and we&apos;ll
          add it for everyone.
        </p>
        <ul className="mt-8 space-y-4">
          {STEPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
                <Icon size={18} />
              </span>
              <span className="pt-2 text-gh-black/70 dark:text-white/70">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="panel flex flex-col gap-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Company name</label>
          <input required name="companyName" maxLength={120} type="text" className="input" placeholder="e.g. Ghana Commercial Bank" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Your name</label>
            <input required name="submitterName" maxLength={100} type="text" className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input required name="submitterEmail" maxLength={200} type="email" className="input" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Source link <span className="font-normal text-gh-black/40 dark:text-white/40">(optional)</span>
          </label>
          <input name="sourceUrl" maxLength={500} type="url" className="input" placeholder="https://brand-website.com.gh/press" />
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gh-black/15 px-4 py-8 text-center transition-colors hover:border-gh-green dark:border-white/15">
          <UploadIcon size={26} className="text-gh-green dark:text-gh-gold" />
          <span className="text-sm font-semibold">
            {fileName ?? "Upload logo file"}
          </span>
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
    </div>
  );
}
