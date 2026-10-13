"use client";

import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Logo, Category } from "@/lib/types";
import LogoGrid from "./LogoGrid";
import AlphabetIndex from "./AlphabetIndex";
import Pagination from "./Pagination";
import { SearchIcon, CloseIcon, ArrowDownIcon } from "./icons";

type Sort = "featured" | "az" | "popular";

const PAGE_SIZE = 60;

function bucket(name: string) {
  const first = name.trim()[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(first) ? first : "#";
}

export default function Browser({
  logos,
  categories,
  initialCategory = null,
}: {
  logos: Logo[];
  categories: Category[];
  initialCategory?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialCategory
  );
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("featured");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setQuery(q);
      document.getElementById("browse")?.scrollIntoView();
    }
  }, []);

  const fuse = useMemo(
    () => new Fuse(logos, { keys: ["name"], threshold: 0.35 }),
    [logos]
  );

  const availableLetters = useMemo(
    () => new Set(logos.map((l) => bucket(l.name))),
    [logos]
  );

  const filtered = useMemo(() => {
    let result = query ? fuse.search(query).map((r) => r.item) : [...logos];

    if (activeCategory) {
      result = result.filter((l) => l.categories?.includes(activeCategory));
    }
    if (activeLetter) {
      result = result.filter((l) => bucket(l.name) === activeLetter);
    }
    if (!query) {
      if (sort === "az") result.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === "popular") {
        result.sort((a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0));
      }
    }
    return result;
  }, [query, activeCategory, activeLetter, sort, fuse, logos]);

  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [query, activeCategory, activeLetter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (next: number) => {
    setPage(next);
    document.getElementById("browse")?.scrollIntoView();
  };

  return (
    <div id="browse" className="scroll-mt-24">
      <div className="panel flex flex-col gap-2 p-2 sm:flex-row">
        <div className="relative sm:w-56">
          <select
            value={activeCategory ?? ""}
            onChange={(e) => setActiveCategory(e.target.value || null)}
            aria-label="Filter by category"
            className="h-12 w-full appearance-none rounded-xl bg-gh-green pl-4 pr-10 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gh-gold"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.title}
              </option>
            ))}
          </select>
          <ArrowDownIcon
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
          />
        </div>

        <label className="relative flex-1">
          <span className="sr-only">Search logos</span>
          <SearchIcon
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gh-black/40 dark:text-white/40"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a company — e.g. GCB, MTN, Telecel, Ecobank"
            className="h-12 w-full rounded-xl bg-transparent pl-12 pr-10 text-sm placeholder:text-gh-black/40 focus:outline-none dark:placeholder:text-white/35"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gh-black/40 hover:text-gh-black dark:text-white/40 dark:hover:text-white"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </label>
      </div>

      <div className="mt-8">
        <AlphabetIndex
          activeLetter={activeLetter}
          onSelect={setActiveLetter}
          availableLetters={availableLetters}
        />
      </div>

      <div className="my-5 flex items-center justify-between gap-4">
        <p className="text-sm text-gh-black/50 dark:text-white/40">
          <span className="font-semibold text-gh-black dark:text-white">
            {filtered.length}
          </span>{" "}
          logo{filtered.length === 1 ? "" : "s"}
          {activeCategory &&
            ` in ${categories.find((c) => c.slug === activeCategory)?.title}`}
          {pageCount > 1 && ` · page ${currentPage} of ${pageCount}`}
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          disabled={Boolean(query)}
          aria-label="Sort logos"
          className="rounded-lg border border-gh-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gh-green disabled:opacity-50 dark:border-white/10 dark:bg-white/5"
        >
          <option value="featured">Featured first</option>
          <option value="az">Name A–Z</option>
          <option value="popular">Most downloaded</option>
        </select>
      </div>

      <LogoGrid logos={visible} />
      <Pagination page={currentPage} pageCount={pageCount} onChange={goToPage} />
    </div>
  );
}
