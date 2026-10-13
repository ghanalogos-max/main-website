"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, GithubIcon, GoogleIcon } from "../icons";

export type Providers = { github: boolean; google: boolean };

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-14">
      <div className="text-center">
        <Image src="/logo-mark.svg" alt="" width={44} height={44} className="mx-auto" />
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">{subtitle}</p>
        )}
      </div>
      <div className="panel mt-8 p-6">{children}</div>
      {footer && (
        <div className="mt-6 text-center text-sm text-gh-black/60 dark:text-white/50">{footer}</div>
      )}
    </div>
  );
}

export function OAuthButtons({
  providers,
  next,
  label,
}: {
  providers: Providers;
  next: string;
  label: "Sign in" | "Sign up";
}) {
  const dev = process.env.NODE_ENV !== "production";
  if (!providers.github && !providers.google && !dev) return null;
  const href = (p: string) => `/api/auth/${p}?next=${encodeURIComponent(next)}`;
  const verb = label === "Sign in" ? "Continue" : "Sign up";
  const buttons = [
    { id: "google" as const, name: "Google", Icon: GoogleIcon },
    { id: "github" as const, name: "GitHub", Icon: GithubIcon },
  ].filter((b) => providers[b.id] || dev);
  const missing = buttons.filter((b) => !providers[b.id]);
  return (
    <>
      <div className="grid gap-2.5">
        {buttons.map(({ id, name, Icon }) =>
          providers[id] ? (
            <a key={id} href={href(id)} className="btn-outline w-full">
              <Icon size={18} />
              {verb} with {name}
            </a>
          ) : (
            <button
              key={id}
              type="button"
              disabled
              title={`Set ${id.toUpperCase()}_CLIENT_ID and ${id.toUpperCase()}_CLIENT_SECRET in .env.local`}
              className="btn-outline w-full cursor-not-allowed opacity-50"
            >
              <Icon size={18} />
              {verb} with {name} (not set up)
            </button>
          )
        )}
      </div>
      {missing.length > 0 && (
        <p className="mt-2 text-center text-xs text-gh-black/50 dark:text-white/40">
          Development only: add{" "}
          {missing.map((b) => `${b.id.toUpperCase()}_CLIENT_ID / _SECRET`).join(" and ")} to{" "}
          <code>.env.local</code> and restart the dev server. Hidden in production until set.
        </p>
      )}
      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-gh-black/40 dark:text-white/40">
        <span className="h-px flex-1 bg-gh-black/10 dark:bg-white/10" />
        or
        <span className="h-px flex-1 bg-gh-black/10 dark:bg-white/10" />
      </div>
    </>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  autoComplete,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete: "current-password" | "new-password";
  id?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        required
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gh-black/40 hover:text-gh-black dark:text-white/40 dark:hover:text-white"
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}

export function TermsNote({ action }: { action: string }) {
  return (
    <p className="mt-4 text-center text-xs text-gh-black/50 dark:text-white/40">
      By {action}, you agree to our{" "}
      <Link href="/terms" className="underline hover:text-gh-green dark:hover:text-gh-gold">
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="underline hover:text-gh-green dark:hover:text-gh-gold">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-gh-red/30 bg-gh-red/10 px-3 py-2 text-sm font-medium text-gh-red">
      {message}
    </p>
  );
}
