"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingIcon, LockIcon, TicketIcon } from "../icons";
import {
  AuthCard,
  FormError,
  OAuthButtons,
  PasswordInput,
  Providers,
  TermsNote,
  postJson,
} from "./AuthUI";

type Method = "password" | "receipt";

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

  const nextQuery = next === "/developers/dashboard" ? "" : `?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (method === "password") {
        await postJson("/api/auth/login", { email, password });
      } else {
        await postJson("/api/auth/login/receipt", { email, reference });
      }
      window.location.assign(next);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function switchMethod(m: Method) {
    setMethod(m);
    setError(null);
  }

  return (
    <AuthCard
      title={method === "password" ? "Sign in" : "Sign in with receipt"}
      subtitle={
        method === "password"
          ? "Welcome back to GhanaLogos."
          : "Forgot your password? Use the email on your account and the reference from any GhanaLogos payment receipt."
      }
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
        ) : (
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
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
          {busy ? <LoadingIcon size={18} className="animate-spin" /> : null}
          {method === "password" ? "Sign in" : "Sign in with receipt"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => switchMethod(method === "password" ? "receipt" : "password")}
        className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-gh-black/60 hover:text-gh-green dark:text-white/60 dark:hover:text-gh-gold"
      >
        {method === "password" ? (
          <>
            <TicketIcon size={16} /> Sign in with a receipt number instead
          </>
        ) : (
          <>
            <LockIcon size={16} /> Sign in with your password instead
          </>
        )}
      </button>

      {(providers.github || providers.google) && method === "password" && (
        <TermsNote action="continuing" />
      )}
    </AuthCard>
  );
}
