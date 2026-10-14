"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, LoadingIcon } from "../icons";
import {
  AuthCard,
  FormError,
  OAuthButtons,
  PasswordInput,
  Providers,
  TermsNote,
  postJson,
} from "./AuthUI";

type Started = {
  token: string;
  email: string;
  phone: string;
  devCodes?: { email?: string; phone?: string };
};

export default function SignupForm({ providers, next }: { providers: Providers; next: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [started, setStarted] = useState<Started | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const nextQuery = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;

  async function sendCodes() {
    const data = await postJson<Started>("/api/auth/signup/start", {
      name,
      email,
      phone,
      password,
      acceptTerms: accept,
    });
    setStarted(data);
    setEmailCode("");
    setPhoneCode("");
    setCooldown(60);
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!accept) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendCodes();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError(null);
    try {
      await sendCodes();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitCodes(e: React.FormEvent) {
    e.preventDefault();
    if (!started) return;
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/auth/signup/complete", { token: started.token, emailCode, phoneCode });
      window.location.assign(next);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (started) {
    return (
      <AuthCard
        title="Verify your details"
        subtitle={
          <>
            We sent a 6-digit code to <strong>{started.email}</strong> and another by SMS to{" "}
            <strong>{started.phone}</strong>. Codes expire in 10 minutes.
          </>
        }
      >
        <form onSubmit={submitCodes} className="grid gap-3">
          <FormError message={error} />
          {started.devCodes && (
            <p className="rounded-xl border border-gh-gold/40 bg-gh-gold/10 px-3 py-2 text-xs">
              Test mode (no email/SMS provider configured): email code{" "}
              <strong className="font-mono">{started.devCodes.email}</strong>, SMS code{" "}
              <strong className="font-mono">{started.devCodes.phone}</strong>
            </p>
          )}
          <label className="grid gap-1.5 text-sm font-medium">
            Email code
            <CodeInput value={emailCode} onChange={setEmailCode} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            SMS code
            <CodeInput value={phoneCode} onChange={setPhoneCode} />
          </label>
          <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
            {busy ? <LoadingIcon size={18} className="animate-spin" /> : null}
            Create account
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStarted(null);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 font-semibold text-gh-black/60 hover:text-gh-green dark:text-white/60 dark:hover:text-gh-gold"
          >
            <ArrowLeftIcon size={16} /> Edit details
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={busy || cooldown > 0}
            className="font-semibold text-gh-green hover:underline disabled:cursor-not-allowed disabled:text-gh-black/40 disabled:no-underline dark:text-gh-gold dark:disabled:text-white/40"
          >
            {cooldown > 0 ? `Resend codes in ${cooldown}s` : "Resend codes"}
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="One account for GhanaLogos downloads and the Developer API."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login${nextQuery}`} className="font-semibold text-gh-green hover:underline dark:text-gh-gold">
            Sign in
          </Link>
        </>
      }
    >
      <OAuthButtons providers={providers} next={next} label="Sign up" />

      <form onSubmit={submitDetails} className="grid gap-3">
        <FormError message={error} />
        <label className="grid gap-1.5 text-sm font-medium">
          Full name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ama Mensah"
            autoComplete="name"
            maxLength={80}
            className="input"
          />
        </label>
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
        <label className="grid gap-1.5 text-sm font-medium">
          Phone number
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024 123 4567"
            autoComplete="tel"
            className="input"
          />
        </label>
        <div className="grid gap-1.5 text-sm font-medium">
          <label htmlFor="new-password">Password</label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <span className="text-xs font-normal text-gh-black/50 dark:text-white/40">
            Use 8 or more characters with at least one letter and one number.
          </span>
        </div>
        <label className="mt-1 flex items-start gap-2.5 text-sm text-gh-black/70 dark:text-white/70">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-gh-green"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="font-semibold underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-semibold underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
          {busy ? <LoadingIcon size={18} className="animate-spin" /> : null}
          Continue
        </button>
      </form>

      {(providers.github || providers.google) && <TermsNote action="signing up with Google or GitHub" />}
    </AuthCard>
  );
}

export function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      required
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="123456"
      className="input text-center font-mono text-lg tracking-[0.5em]"
    />
  );
}
