"use client";

import Link from "next/link";
import { Logo } from "@/lib/types";
import { useDownloads } from "./DownloadProvider";
import { DownloadIcon, CopyIcon, LoadingIcon, StarIcon } from "./icons";

export default function LogoCard({ logo }: { logo: Logo }) {
  const { download, copySvg, busy } = useDownloads();
  const downloading = busy === `${logo.slug}:file`;
  const copying = busy === `${logo.slug}:copy`;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gh-black/10 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:border-gh-green/40 hover:shadow-lift dark:border-white/10 dark:bg-ink-900 dark:shadow-none dark:hover:border-gh-gold/40">
      <Link
        href={`/logo/${logo.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`${logo.name} logo`}
      />

      <div className="checker pointer-events-none flex aspect-[4/3] items-center justify-center p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.imageUrl}
          alt={`${logo.name} logo`}
          width={logo.width}
          height={logo.height}
          loading="lazy"
          decoding="async"
          className="h-auto max-h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {logo.featured && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gh-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gh-black">
          <StarIcon size={11} />
          Popular
        </span>
      )}

      <div className="pointer-events-none flex items-center justify-between gap-2 border-t border-gh-black/5 px-4 py-3 dark:border-white/10">
        <h3 className="truncate text-sm font-semibold">{logo.name}</h3>
        <span className="shrink-0 rounded bg-gh-black/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gh-black/50 dark:bg-white/10 dark:text-white/50">
          {logo.format}
        </span>
      </div>

      <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        {logo.format === "svg" && (
          <button
            onClick={() => copySvg(logo)}
            disabled={copying}
            aria-label={`Copy ${logo.name} SVG code`}
            title="Copy SVG"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gh-black shadow-card ring-1 ring-black/5 hover:text-gh-green"
          >
            {copying ? <LoadingIcon size={16} className="animate-spin" /> : <CopyIcon size={16} />}
          </button>
        )}
        <button
          onClick={() => download(logo)}
          disabled={downloading}
          aria-label={`Download ${logo.name} ${logo.format.toUpperCase()}`}
          title={`Download ${logo.format.toUpperCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gh-green text-white shadow-card hover:bg-[#005A35]"
        >
          {downloading ? (
            <LoadingIcon size={16} className="animate-spin" />
          ) : (
            <DownloadIcon size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
