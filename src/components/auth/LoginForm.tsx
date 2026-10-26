"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingIcon, LockIcon, MailIcon, TicketIcon } from "../icons";
import {
  AuthCard,
  FormError,
  OAuthButtons,
  PasswordInput,
  Providers,
  TermsNote,
  postJson,
} from "./AuthUI";

type Method = "password" | "receipt" | "magic";

export default function LoginForm({
  providers,
  next,
  error: initialError,
  method: initialMethod,
}: {
  providers: Providers;
  next: string;
  error: string | null;
  method: Method;
}) {
  const [method, setMethod] = useState<Method>(initialMethod);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [devLink, setDevLink] = useState<string | undefined>();

  const nextQuery = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (method === "password") {
        await postJson("/api/auth/login", { email, password });
        window.location.assign(next);
      } else if (method === "receipt") {
        await postJson("/api/auth/login/receipt", { email, reference });
        window.location.assign(next);
      } else {
        const data = await postJson<{ ok: true; devLink?: string }>("/api/auth/login/magic", {
          email,
          next,
        });
        setDevLink(data.devLink);
        setMagicSent(true);
        setBusy(false);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function switchMethod(m: Method) {
    setMethod(m);
    setError(null);
    setMagicSent(false);
    setDevLink(undefined);
  }

  const title =
    method === "password" ? "Sign in" : method === "receipt" ? "Sign in with receipt" : "Email me a link";
  const subtitle =
    method === "password"
      ? "Welcome back to GhanaLogos."
      : method === "receipt"
        ? "Forgot your password? Use the email on your account and the reference from any GhanaLogos payment receipt."
        : "We'll email you a one-time link. No password needed.";

  if (method === "magic" && magicSent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle={
          <>
            If an account exists for <strong>{email}</strong>, we sent a sign-in link. It expires in 15
            minutes.
          </>
        }
        footer={
          <button
            type="button"
            onClick={() => switchMethod("password")}
            className="font-semibold text-gh-green hover:underline dark:text-gh-gold"
          >
            Back to password sign-in
          </button>
        }
      >
        {devLink && (
          <p className="rounded-xl border border-gh-gold/40 bg-gh-gold/10 px-3 py-2 text-xs">
            Test mode (no email provider configured):{" "}
            <a href={devLink} className="font-semibold underline break-all">
              {devLink}
            </a>
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setMagicSent(false);
            setDevLink(undefined);
          }}
          className="mt-2 text-sm font-semibold text-gh-green hover:underline dark:text-gh-gold"
        >
          Use a different email
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={title}
      subtitle={subtitle}
      footer={
        <>
          New to GhanaLogos?{" "}
          <Link href={`/signup${nextQuery}`} className="font-semibold text-gh-green hover:underline dark:text-gh-gold">
            Create an account
          </Link>
        </>
      }
    >
      {method === "password" && <OAuthButtons providers={providers} next={next} label="Sign in" />}

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

        {method === "password" ? (
          <div className="grid gap-1.5 text-sm font-medium">
            <div className="flex items-center justify-between">
              <label htmlFor="password">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-gh-green hover:underline dark:text-gh-gold"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
          </div>
        ) : method === "receipt" ? (
          <label className="grid gap-1.5 text-sm font-medium">
            Receipt / ticket number
            <input
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. T284719305615"
              autoComplete="off"
              spellCheck={false}
              className="input font-mono"
            />
            <span className="text-xs font-normal text-gh-black/50 dark:text-white/40">
              It&apos;s the &quot;Reference&quot; on the Paystack receipt we emailed you.
            </span>
          </label>
        ) : null}

        <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
          {busy ? <LoadingIcon size={18} className="animate-spin" /> : null}
          {method === "password" ? "Sign in" : method === "receipt" ? "Sign in with receipt" : "Email me a sign-in link"}
        </button>
      </form>

      <div className="mt-4 grid gap-2">
        {method !== "magic" && (
          <button
            type="button"
            onClick={() => switchMethod("magic")}
            className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-gh-black/60 hover:text-gh-green dark:text-white/60 dark:hover:text-gh-gold"
          >
            <MailIcon size={16} /> Email me a sign-in link instead
          </button>
        )}
        {method !== "receipt" && (
          <button
            type="button"
            onClick={() => switchMethod("receipt")}
            className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-gh-black/60 hover:text-gh-green dark:text-white/60 dark:hover:text-gh-gold"
          >
            <TicketIcon size={16} /> Sign in with a receipt number instead
          </button>
        )}
        {method !== "password" && (
          <button
            type="button"
            onClick={() => switchMethod("password")}
            className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-gh-black/60 hover:text-gh-green dark:text-white/60 dark:hover:text-gh-gold"
          >
            <LockIcon size={16} /> Sign in with your password instead
          </button>
        )}
      </div>

      {(providers.github || providers.google) && method === "password" && (
        <TermsNote action="continuing" />
      )}
    </AuthCard>
  );
}
