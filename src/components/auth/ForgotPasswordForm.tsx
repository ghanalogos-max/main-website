"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, LoadingIcon, TicketIcon } from "../icons";
import { AuthCard, FormError, postJson } from "./AuthUI";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await postJson<{ devLink?: string }>("/api/auth/forgot", { email });
      setDevLink(data.devLink ?? null);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const footer = (
    <div className="grid gap-3">
      <Link
        href="/login?method=receipt"
        className="inline-flex items-center justify-center gap-2 font-semibold text-gh-black/70 hover:text-gh-green dark:text-white/70 dark:hover:text-gh-gold"
      >
        <TicketIcon size={16} /> Paid for a plan? Sign in with your receipt number
      </Link>
      <span>
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-gh-green hover:underline dark:text-gh-gold">
          Back to sign in
        </Link>
      </span>
    </div>
  );

  if (sent) {
    return (
      <AuthCard title="Check your email" footer={footer}>
        <div className="flex gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gh-green/10 text-gh-green">
            <CheckIcon size={18} />
          </span>
          <p className="text-sm text-gh-black/70 dark:text-white/70">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your
            password. It&apos;s valid for 1 hour. Check your spam folder if it doesn&apos;t arrive in a
            few minutes.
          </p>
        </div>
        {devLink && (
          <p className="mt-4 break-all rounded-xl border border-gh-gold/40 bg-gh-gold/10 px-3 py-2 text-xs">
            Test mode (no email provider configured):{" "}
            <a href={devLink} className="font-semibold underline">
              open reset link
            </a>
          </p>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter the email on your account and we'll send you a link to reset it."
      footer={footer}
    >
      <form onSubmit={submit} className="grid gap-3">
        <FormError message={error} />
        <label className="grid gap-1.5 text-sm font-medium">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            className="input"
          />
        </label>
        <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
          {busy ? <LoadingIcon size={18} className="animate-spin" /> : null}
          Send reset link
        </button>
      </form>
    </AuthCard>
  );
}
