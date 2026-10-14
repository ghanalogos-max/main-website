"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingIcon } from "../icons";
import { AuthCard, FormError, PasswordInput, postJson } from "./AuthUI";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        subtitle="This link is missing its token. Request a new one."
        footer={
          <Link href="/forgot-password" className="font-semibold text-gh-green hover:underline dark:text-gh-gold">
            Request a new link
          </Link>
        }
      >
        <Link href="/login" className="btn-outline w-full">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/auth/reset", { token, password });
      window.location.assign("/account");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="You'll be signed out on every other device."
      footer={
        <Link href="/forgot-password" className="font-semibold text-gh-green hover:underline dark:text-gh-gold">
          Request a new link
        </Link>
      }
    >
      <form onSubmit={submit} className="grid gap-3">
        <FormError message={error} />
        <div className="grid gap-1.5 text-sm font-medium">
          <label htmlFor="new-password">New password</label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </div>
        <div className="grid gap-1.5 text-sm font-medium">
          <label htmlFor="confirm-password">Confirm new password</label>
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Repeat password"
          />
          <span className="text-xs font-normal text-gh-black/50 dark:text-white/40">
            Use 8 or more characters with at least one letter and one number.
          </span>
        </div>
        <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
          {busy ? <LoadingIcon size={18} className="animate-spin" /> : null}
          Reset password
        </button>
      </form>
    </AuthCard>
  );
}
