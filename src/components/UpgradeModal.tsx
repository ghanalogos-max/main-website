"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PLANS } from "@/lib/plans";
import { CloseIcon, CrownIcon, CheckIcon, TimeIcon } from "./icons";

export type UpgradeReason = "limit" | "size" | "manual";

const HEADLINES: Record<UpgradeReason, { title: string; body: (n: number) => string }> = {
  limit: {
    title: "You've used today's free downloads",
    body: (n) =>
      `Free accounts get ${n} downloads a day. Go Premium for unlimited SVG and PNG downloads, or come back tomorrow.`,
  },
  size: {
    title: "4K PNG export is a Premium feature",
    body: () =>
      "Upgrade to export ultra high resolution 4096px PNGs for print, billboards and presentations.",
  },
  manual: {
    title: "Upgrade to GhanaLogos Premium",
    body: (n) =>
      `Go beyond ${n} free downloads a day and support an open library of Ghanaian brand assets.`,
  },
};

export default function UpgradeModal({
  reason,
  limit,
  onClose,
}: {
  reason: UpgradeReason;
  limit: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const copy = HEADLINES[reason];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gh-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
    >
      <div
        className="panel relative w-full max-w-md overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kente h-1.5" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-5 rounded-full p-1.5 text-gh-black/50 hover:bg-gh-black/5 hover:text-gh-black dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <CloseIcon size={20} />
        </button>

        <div className="p-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gh-gold/20 text-[#9A7B00] dark:text-gh-gold">
            <CrownIcon size={26} />
          </div>
          <h2 id="upgrade-title" className="font-display text-xl font-bold">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-gh-black/60 dark:text-white/60">
            {copy.body(limit)}
          </p>

          <ul className="mt-5 space-y-2 text-sm">
            {[
              "Unlimited SVG & PNG downloads",
              "4K (4096px) PNG exports",
              "Copy SVG code without limits",
              "Supports new Ghanaian logos being added",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckIcon size={18} className="shrink-0 text-gh-green" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/premium" onClick={onClose} className="btn-gold flex-1">
              <CrownIcon size={18} />
              From GH₵{PLANS.monthly.priceGhs}/month
            </Link>
            <button onClick={onClose} className="btn-outline">
              Maybe later
            </button>
          </div>

          {reason === "limit" && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-gh-black/50 dark:text-white/40">
              <TimeIcon size={14} />
              Free downloads reset at midnight (GMT).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
