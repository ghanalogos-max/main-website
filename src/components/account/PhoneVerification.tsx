"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingIcon, PhoneIcon } from "@/components/icons";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}

export default function PhoneVerification({
  current,
  title = "Verify your phone number",
  description = "A verified phone number is needed to create API keys, buy plans and receive contributor payouts. We'll send a 6-digit code by SMS.",
  onCancel,
}: {
  current: string | null;
  title?: string;
  description?: string;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(current ?? "");
  const [pending, setPending] = useState<{ token: string; phone: string; devCode?: string } | null>(
    null
  );
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setPending(await post("/api/auth/phone/start", { phone }));
      setCode("");
      setCooldown(60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      await post("/api/auth/phone/confirm", { token: pending.token, code });
      router.refresh();
      onCancel?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gh-gold/50 bg-gh-gold/10 p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <PhoneIcon size={20} />
        {title}
      </h2>
      <p className="mt-1 text-sm text-gh-black/70 dark:text-white/60">{description}</p>
      {error && <p className="mt-3 text-sm font-medium text-gh-red">{error}</p>}
      {pending ? (
        <form onSubmit={confirmCode} className="mt-4 grid gap-3 sm:max-w-md">
          <p className="text-sm">
            Code sent to <strong>{pending.phone}</strong>.
          </p>
          {pending.devCode && (
            <p className="font-mono text-xs">Test mode (no SMS provider configured): {pending.devCode}</p>
          )}
          <div className="flex gap-2">
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="input flex-1 text-center font-mono tracking-[0.4em]"
            />
            <button type="submit" disabled={busy} className="btn-primary">
              {busy && <LoadingIcon size={16} className="animate-spin" />}
              Verify
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="font-medium text-gh-black/60 hover:text-gh-black dark:text-white/60 dark:hover:text-white"
            >
              Change number
            </button>
            <button
              type="button"
              onClick={() => send()}
              disabled={busy || cooldown > 0}
              className="font-semibold text-gh-green hover:underline disabled:text-gh-black/40 disabled:no-underline dark:text-gh-gold dark:disabled:text-white/40"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={send} className="mt-4 flex flex-col gap-2 sm:max-w-md sm:flex-row">
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024 123 4567"
            autoComplete="tel"
            className="input sm:flex-1"
          />
          <button type="submit" disabled={busy} className="btn-dark">
            {busy && <LoadingIcon size={16} className="animate-spin" />}
            Send code
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-outline">
              Cancel
            </button>
          )}
        </form>
      )}
    </section>
  );
}
