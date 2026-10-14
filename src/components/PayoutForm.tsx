"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, LoadingIcon } from "@/components/icons";

const NETWORKS = [
  { id: "mtn", label: "MTN MoMo" },
  { id: "telecel", label: "Telecel Cash" },
  { id: "at", label: "AT Money" },
];

export default function PayoutForm({
  initial,
}: {
  initial: { network?: string; number?: string; accountName?: string };
}) {
  const router = useRouter();
  const [network, setNetwork] = useState(initial.network ?? "mtn");
  const [number, setNumber] = useState(initial.number ?? "");
  const [accountName, setAccountName] = useState(initial.accountName ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/contributors/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, number, accountName }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) {
        router.push("/login?next=%2Fcontributors%2Fdashboard");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Couldn't save. Please try again.");
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Network</label>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          className="input"
        >
          {NETWORKS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Mobile Money number</label>
        <input
          required
          type="tel"
          inputMode="tel"
          maxLength={20}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="input"
          placeholder="024 123 4567"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Name on the wallet</label>
        <input
          required
          maxLength={100}
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="input"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 sm:col-span-3 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3 sm:col-span-3">
        <button type="submit" disabled={status === "saving"} className="btn-primary">
          {status === "saving" && <LoadingIcon size={16} className="animate-spin" />}
          Save payout details
        </button>
        {status === "saved" && (
          <span className="flex items-center gap-1 text-sm text-gh-green">
            <CheckIcon size={16} /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
