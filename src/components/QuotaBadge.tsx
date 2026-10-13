"use client";

import Link from "next/link";
import { useDownloads } from "./DownloadProvider";
import { CrownIcon, DownloadIcon } from "./icons";

export default function QuotaBadge() {
  const { quota, openUpgrade } = useDownloads();
  if (!quota) return null;

  if (quota.premium) {
    return (
      <Link
        href="/premium"
        className="hidden items-center gap-1.5 rounded-full bg-gh-gold/20 px-3 py-1.5 text-xs font-bold text-[#7A6200] sm:inline-flex dark:text-gh-gold"
      >
        <CrownIcon size={14} />
        Premium
      </Link>
    );
  }

  const remaining = quota.remaining ?? 0;
  return (
    <button
      onClick={() => openUpgrade("manual")}
      title="Free downloads left today"
      className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:inline-flex ${
        remaining === 0
          ? "border-gh-red/30 bg-gh-red/10 text-gh-red"
          : "border-gh-black/10 bg-white/70 text-gh-black/70 hover:border-gh-green dark:border-white/15 dark:bg-white/5 dark:text-white/70"
      }`}
    >
      <DownloadIcon size={14} />
      {remaining}/{quota.limit} free today
    </button>
  );
}
