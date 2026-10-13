"use client";

import { useState } from "react";
import { Logo } from "@/lib/types";
import { PNG_SIZES, PREMIUM_ONLY_SIZES } from "@/lib/plans";
import { useDownloads } from "./DownloadProvider";
import {
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  LoadingIcon,
  LockIcon,
  CrownIcon,
  VectorIcon,
  ImageIcon,
} from "./icons";

const BACKGROUNDS = [
  { id: "checker", label: "Transparent", className: "checker" },
  { id: "light", label: "Light", className: "bg-white" },
  { id: "dark", label: "Dark", className: "bg-gh-black" },
] as const;

type Bg = (typeof BACKGROUNDS)[number]["id"];

export default function LogoDetail({ logo }: { logo: Logo }) {
  const { download, copySvg, busy, quota, openUpgrade } = useDownloads();
  const [bg, setBg] = useState<Bg>("checker");
  const [size, setSize] = useState<number>(1024);
  const [copiedColor, setCopiedColor] = useState(false);

  const isPremium = Boolean(quota?.premium);
  const sizeLocked = !isPremium && PREMIUM_ONLY_SIZES.includes(size);
  const isBusy = (key: string) => busy === `${logo.slug}:${key}`;

  async function copyColor() {
    if (!logo.brandColor) return;
    await navigator.clipboard.writeText(logo.brandColor);
    setCopiedColor(true);
    setTimeout(() => setCopiedColor(false), 1500);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="panel min-w-0 overflow-hidden">
        <div
          className={`flex aspect-[4/3] items-center justify-center p-12 transition-colors ${
            BACKGROUNDS.find((b) => b.id === bg)!.className
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.imageUrl}
            alt={`${logo.name} logo`}
            width={logo.width}
            height={logo.height}
            className="h-auto max-h-full w-auto max-w-full object-contain"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gh-black/5 px-4 py-3 dark:border-white/10">
          <span className="hidden text-xs font-medium text-gh-black/50 sm:inline dark:text-white/40">
            Preview background
          </span>
          <div className="flex gap-1 rounded-full bg-gh-black/5 p-1 dark:bg-white/10">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBg(b.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  bg === b.id
                    ? "bg-white text-gh-black shadow-sm dark:bg-ink-800 dark:text-white"
                    : "text-gh-black/60 dark:text-white/60"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {logo.format !== "svg" ? (
          <div className="panel p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ImageIcon size={18} className="text-gh-green dark:text-gh-gold" />
              {logo.format === "png" ? "Transparent PNG" : `${logo.format.toUpperCase()} image`}
            </div>
            <p className="mt-1 text-xs text-gh-black/50 dark:text-white/40">
              Highest quality file available
              {logo.width && logo.height ? ` · ${logo.width} × ${logo.height}px` : ""}.
              No official vector version has been published yet.
            </p>
            <button
              onClick={() => download(logo)}
              disabled={isBusy("file")}
              className="btn-primary mt-4 w-full"
            >
              {isBusy("file") ? (
                <LoadingIcon size={16} className="animate-spin" />
              ) : (
                <DownloadIcon size={16} />
              )}
              Download {logo.format.toUpperCase()}
            </button>
          </div>
        ) : (
        <>
        <div className="panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <VectorIcon size={18} className="text-gh-green dark:text-gh-gold" />
            Vector (SVG)
          </div>
          <p className="mt-1 text-xs text-gh-black/50 dark:text-white/40">
            Best for print, web and design tools. Scales to any size.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => download(logo)}
              disabled={isBusy("file")}
              className="btn-primary"
            >
              {isBusy("file") ? (
                <LoadingIcon size={16} className="animate-spin" />
              ) : (
                <DownloadIcon size={16} />
              )}
              Download SVG
            </button>
            <button
              onClick={() => copySvg(logo)}
              disabled={isBusy("copy")}
              className="btn-outline"
            >
              {isBusy("copy") ? (
                <LoadingIcon size={16} className="animate-spin" />
              ) : (
                <CopyIcon size={16} />
              )}
              Copy code
            </button>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ImageIcon size={18} className="text-gh-green dark:text-gh-gold" />
            Transparent PNG
          </div>
          <p className="mt-1 text-xs text-gh-black/50 dark:text-white/40">
            Choose the size of the longest side.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {PNG_SIZES.map((s) => {
              const locked = !isPremium && PREMIUM_ONLY_SIZES.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`relative rounded-lg border py-2 text-xs font-semibold transition-colors ${
                    size === s
                      ? "border-gh-green bg-gh-green/10 text-gh-green dark:border-gh-gold dark:bg-gh-gold/10 dark:text-gh-gold"
                      : "border-gh-black/10 hover:border-gh-black/30 dark:border-white/10 dark:hover:border-white/30"
                  }`}
                >
                  {s === 4096 ? "4K" : s}
                  {locked && (
                    <LockIcon
                      size={11}
                      className="absolute right-1 top-1 text-[#9A7B00] dark:text-gh-gold"
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => (sizeLocked ? openUpgrade("size") : download(logo, size))}
            disabled={isBusy(String(size))}
            className={`mt-3 w-full ${sizeLocked ? "btn-gold" : "btn-dark"}`}
          >
            {isBusy(String(size)) ? (
              <LoadingIcon size={16} className="animate-spin" />
            ) : sizeLocked ? (
              <CrownIcon size={16} />
            ) : (
              <DownloadIcon size={16} />
            )}
            {sizeLocked ? "Unlock 4K with Premium" : `Download PNG · ${size}px`}
          </button>
        </div>
        </>
        )}

        {logo.brandColor && (
          <button
            onClick={copyColor}
            className="panel flex items-center gap-3 p-4 text-left transition-colors hover:border-gh-green/40"
          >
            <span
              className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-black/10"
              style={{ backgroundColor: logo.brandColor }}
            />
            <span className="flex-1">
              <span className="block text-xs text-gh-black/50 dark:text-white/40">
                Primary brand colour
              </span>
              <span className="font-mono text-sm font-semibold uppercase">
                {logo.brandColor}
              </span>
            </span>
            {copiedColor ? (
              <CheckIcon size={18} className="text-gh-green" />
            ) : (
              <CopyIcon size={18} className="text-gh-black/40 dark:text-white/40" />
            )}
          </button>
        )}

        {quota && (
          <p className="text-center text-xs text-gh-black/50 dark:text-white/40">
            {quota.premium ? (
              <span className="inline-flex items-center gap-1 font-semibold text-[#7A6200] dark:text-gh-gold">
                <CrownIcon size={13} /> Premium · unlimited downloads
              </span>
            ) : (
              <>
                {quota.remaining} of {quota.limit} free downloads left today ·{" "}
                <button
                  onClick={() => openUpgrade("manual")}
                  className="font-semibold text-gh-green underline-offset-2 hover:underline dark:text-gh-gold"
                >
                  Go unlimited
                </button>
              </>
            )}
          </p>
        )}
      </aside>
    </div>
  );
}
