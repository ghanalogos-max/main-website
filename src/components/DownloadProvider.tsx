"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { svgToPng, saveBlob } from "@/lib/rasterize";
import { FREE_DAILY_LIMIT } from "@/lib/plans";
import type { LogoFormat } from "@/lib/types";
import UpgradeModal, { UpgradeReason } from "./UpgradeModal";
import { CheckIcon, InfoIcon } from "./icons";

export interface Quota {
  premium: { plan: string; expiresAt: number; email: string } | null;
  used: number;
  limit: number;
  remaining: number | null;
}

type Target = { slug: string; name: string; format: LogoFormat };

interface DownloadContextValue {
  quota: Quota | null;
  busy: string | null;
  refresh: () => Promise<void>;
  download: (logo: Target, size?: number) => Promise<void>;
  copySvg: (logo: Target) => Promise<void>;
  openUpgrade: (reason?: UpgradeReason) => void;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function useDownloads() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error("useDownloads must be used inside DownloadProvider");
  return ctx;
}

interface Toast {
  id: number;
  tone: "success" | "info";
  text: string;
}

export default function DownloadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeReason | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/quota", { cache: "no-store" });
      if (res.ok) setQuota(await res.json());
    } catch {
      // Keep the last known quota on network errors.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (tone: Toast["tone"], text: string) =>
    setToast({ id: Date.now(), tone, text });

  const fetchFile = useCallback(
    async (
      logo: Target,
      size?: number
    ): Promise<{ blob: Blob; remaining: string | null } | null> => {
      const res = await fetch(
        `/api/download/${logo.slug}${size ? `?size=${size}` : ""}`,
        { cache: "no-store" }
      );

      if (res.status === 402) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        setUpgrade(error === "premium_required" ? "size" : "limit");
        await refresh();
        return null;
      }
      if (!res.ok) {
        notify("info", "Sorry, that file is unavailable right now.");
        return null;
      }

      const remaining = res.headers.get("X-Downloads-Remaining");
      setQuota((q) =>
        q && remaining && remaining !== "unlimited"
          ? {
              ...q,
              remaining: Number(remaining),
              used: q.limit - Number(remaining),
            }
          : q
      );
      return { blob: await res.blob(), remaining };
    },
    [refresh]
  );

  const remainingNote = (remaining: string | null) =>
    !remaining || remaining === "unlimited"
      ? ""
      : ` · ${remaining} free left today`;

  const download = useCallback(
    async (logo: Target, size?: number) => {
      setBusy(`${logo.slug}:${size ?? "file"}`);
      try {
        const result = await fetchFile(logo, logo.format === "svg" ? size : undefined);
        if (!result) return;
        let label: string;
        if (logo.format !== "svg") {
          saveBlob(result.blob, `${logo.slug}-logo.${logo.format}`);
          label = logo.format.toUpperCase();
        } else if (size) {
          saveBlob(
            await svgToPng(await result.blob.text(), size),
            `${logo.slug}-logo-${size}px.png`
          );
          label = `PNG (${size}px)`;
        } else {
          saveBlob(result.blob, `${logo.slug}-logo.svg`);
          label = "SVG";
        }
        notify(
          "success",
          `${logo.name} ${label} downloaded${remainingNote(result.remaining)}`
        );
      } catch {
        notify("info", "Download failed. Please try again.");
      } finally {
        setBusy(null);
      }
    },
    [fetchFile]
  );

  const copySvg = useCallback(
    async (logo: Target) => {
      setBusy(`${logo.slug}:copy`);
      try {
        const result = await fetchFile(logo);
        if (!result) return;
        await navigator.clipboard.writeText(await result.blob.text());
        notify("success", `${logo.name} SVG code copied to clipboard`);
      } catch {
        notify("info", "Could not copy to clipboard.");
      } finally {
        setBusy(null);
      }
    },
    [fetchFile]
  );

  return (
    <DownloadContext.Provider
      value={{
        quota,
        busy,
        refresh,
        download,
        copySvg,
        openUpgrade: (reason = "manual") => setUpgrade(reason),
      }}
    >
      {children}

      {upgrade && (
        <UpgradeModal
          reason={upgrade}
          limit={quota?.limit ?? FREE_DAILY_LIMIT}
          onClose={() => setUpgrade(null)}
        />
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 animate-fade-up"
        >
          <div className="flex items-center gap-2.5 rounded-full bg-gh-black px-5 py-3 text-sm font-medium text-white shadow-lift dark:bg-white dark:text-gh-black">
            {toast.tone === "success" ? (
              <CheckIcon size={18} className="text-gh-gold dark:text-gh-green" />
            ) : (
              <InfoIcon size={18} className="text-gh-gold dark:text-gh-red" />
            )}
            {toast.text}
          </div>
        </div>
      )}
    </DownloadContext.Provider>
  );
}
