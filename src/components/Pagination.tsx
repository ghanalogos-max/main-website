"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

function pageList(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export default function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const arrow =
    "flex h-10 items-center gap-1.5 rounded-full border border-gh-black/10 bg-white px-4 text-sm font-semibold transition-colors hover:border-gh-green hover:text-gh-green disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-ink-900 dark:hover:border-gh-gold dark:hover:text-gh-gold";

  return (
    <nav aria-label="Logo pages" className="mt-10 flex items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={arrow}>
        <ArrowLeftIcon size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <ol className="flex items-center gap-1">
        {pageList(page, pageCount).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-1 text-sm text-gh-black/40 dark:text-white/40">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`h-10 w-10 rounded-full text-sm font-semibold transition-colors ${
                  p === page
                    ? "bg-gh-black text-white dark:bg-white dark:text-gh-black"
                    : "hover:bg-gh-black/5 dark:hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            </li>
          )
        )}
      </ol>

      <button onClick={() => onChange(page + 1)} disabled={page === pageCount} className={arrow}>
        <span className="hidden sm:inline">Next</span>
        <ArrowRightIcon size={16} />
      </button>
    </nav>
  );
}
