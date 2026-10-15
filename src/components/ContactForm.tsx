"use client";

import { useState } from "react";
import { CheckIcon, LoadingIcon, MailIcon } from "@/components/icons";
import { CONTACT_TOPICS, MESSAGE_MAX, MESSAGE_MIN, type ContactTopic } from "@/lib/contact";

type Field = "name" | "email" | "phone" | "message";

export default function ContactForm({
  initial,
}: {
  initial: { name?: string; email?: string; phone?: string; topic?: ContactTopic };
}) {
  const [form, setForm] = useState({
    name: initial.name ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    organisation: "",
    topic: initial.topic ?? ("general" as ContactTopic),
    message: "",
    website: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<{ message: string; field?: Field } | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; field?: Field };
      if (!res.ok) {
        setError({ message: data.error || "Something went wrong. Please try again.", field: data.field });
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError({ message: "Check your connection and try again." });
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="panel flex flex-col items-center p-8 text-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gh-green/10 text-gh-green">
          <CheckIcon size={28} />
        </span>
        <h2 className="font-display text-2xl font-bold">Message sent</h2>
        <p className="mt-2 text-gh-black/60 dark:text-white/50">
          Thanks, {form.name.split(" ")[0]}. We usually reply within one to two working days at{" "}
          <strong>{form.email}</strong>.
        </p>
        <button
          type="button"
          className="btn-outline mt-6"
          onClick={() => {
            setForm((f) => ({ ...f, message: "" }));
            setStatus("idle");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const invalid = (field: Field) => error?.field === field;
  const inputClass = (field: Field) => `input ${invalid(field) ? "!border-gh-red focus:!ring-gh-red/30" : ""}`;

  return (
    <form onSubmit={submit} className="panel relative grid gap-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium">
            Full name
          </label>
          <input
            id="c-name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
            aria-invalid={invalid("name")}
            className={inputClass("name")}
          />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium">
            Email address
          </label>
          <input
            id="c-email"
            required
            type="email"
            maxLength={200}
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            aria-invalid={invalid("email")}
            className={inputClass("email")}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="c-phone" className="mb-1.5 block text-sm font-medium">
            Phone number <span className="font-normal text-gh-black/40 dark:text-white/40">(optional)</span>
          </label>
          <input
            id="c-phone"
            type="tel"
            inputMode="tel"
            maxLength={30}
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            aria-invalid={invalid("phone")}
            className={inputClass("phone")}
            placeholder="024 123 4567"
          />
        </div>
        <div>
          <label htmlFor="c-org" className="mb-1.5 block text-sm font-medium">
            Organisation <span className="font-normal text-gh-black/40 dark:text-white/40">(optional)</span>
          </label>
          <input
            id="c-org"
            maxLength={120}
            autoComplete="organization"
            value={form.organisation}
            onChange={set("organisation")}
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="c-topic" className="mb-1.5 block text-sm font-medium">
          What is it about?
        </label>
        <select id="c-topic" value={form.topic} onChange={set("topic")} className="input">
          {Object.entries(CONTACT_TOPICS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="c-message"
          required
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          rows={6}
          value={form.message}
          onChange={set("message")}
          aria-invalid={invalid("message")}
          className={`${inputClass("message")} min-h-[9rem] resize-y py-3`}
          placeholder={
            form.topic === "removal"
              ? "Which logo, and what should we change? Please write from an official company email if you can."
              : form.topic === "logo-request"
                ? "Which brand is missing? A link to its official website helps."
                : "How can we help?"
          }
        />
        <p className="mt-1 text-right text-xs text-gh-black/40 dark:text-white/40">
          {form.message.length} / {MESSAGE_MAX}
        </p>
      </div>

      {/* Honeypot: hidden from people, filled in by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gh-black/50 dark:text-white/40">
          We only use your details to reply to you.
        </p>
        <button type="submit" disabled={status === "sending"} className="btn-primary">
          {status === "sending" ? <LoadingIcon size={16} className="animate-spin" /> : <MailIcon size={16} />}
          {status === "sending" ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}
