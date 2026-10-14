"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import QuotaBadge from "./QuotaBadge";
import { MenuIcon, CloseIcon, UploadIcon, UserIcon } from "./icons";

const NAV = [
  { href: "/", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/premium", label: "Premium" },
  { href: "/developers", label: "API" },
  { href: "/contribute", label: "Contribute" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<string | null | undefined>(undefined);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.signedIn ? data.name || "Account" : null))
      .catch(() => setUser(null));
  }, []);

  const firstName = user ? user.split(/\s+/)[0].slice(0, 16) : "";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-gh-black/5 bg-white dark:border-white/10 dark:bg-ink-950">
      <div className="kente h-1" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="GhanaLogos home">
          <Image src="/logo-mark.svg" alt="" width={38} height={38} priority />
          <div className="leading-none">
            <span className="font-display text-lg font-extrabold tracking-tight">
              Ghana<span className="text-gh-red">Logos</span>
            </span>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-gh-green dark:text-gh-gold">
              Vector logo library
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-gh-black/5 text-gh-black dark:bg-white/10 dark:text-white"
                  : "text-gh-black/60 hover:text-gh-black dark:text-white/60 dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <QuotaBadge />
          <Link href="/contribute" className="btn-dark hidden !px-4 !py-2 lg:inline-flex">
            <UploadIcon size={16} />
            Submit logo
          </Link>
          {user !== undefined && (
            <Link
              href={user ? "/account" : "/login"}
              className="btn-outline hidden !px-4 !py-2 md:inline-flex"
            >
              <UserIcon size={16} />
              {user ? firstName : "Sign in"}
            </Link>
          )}
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gh-black/10 md:hidden dark:border-white/15"
          >
            {open ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-gh-black/5 px-4 pb-4 pt-2 md:hidden dark:border-white/10">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-gh-green/10 text-gh-green dark:text-gh-gold"
                  : "text-gh-black/70 dark:text-white/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user !== undefined && (
            <Link
              href={user ? "/account" : "/login"}
              className="mt-2 flex items-center gap-2 rounded-xl border border-gh-black/10 px-3 py-2.5 text-sm font-semibold dark:border-white/15"
            >
              <UserIcon size={16} />
              {user ? `${firstName} · Dashboard` : "Sign in / Create account"}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
