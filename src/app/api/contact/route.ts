import { NextRequest, NextResponse } from "next/server";
import { EMAIL, clientIp } from "@/lib/auth";
import { CONTACT_TOPICS, MESSAGE_MAX, MESSAGE_MIN, isContactTopic, type ContactTopic } from "@/lib/contact";
import { emailEnabled, sendEmail } from "@/lib/notify";
import { kv, storeEnabled } from "@/lib/store";
import { PHONE_HINT, formatPhone, normalizePhone } from "@/lib/verification";

export const dynamic = "force-dynamic";

const CONTACT_TO = process.env.CONTACT_EMAIL || "hello@ghanalogos.com";

function fail(error: string, status = 400, field?: string) {
  return NextResponse.json({ error, field }, { status });
}

/** Single-line text: control characters are replaced so values can't break the subject line. */
const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max) : "";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: NextRequest) {
  if (!emailEnabled && process.env.NODE_ENV === "production") {
    return fail(`The contact form isn't available right now. Please email ${CONTACT_TO}.`, 503);
  }

  const body = await req.json().catch(() => ({}));
  // Bots fill every field; people never see this one.
  if (str(body.website, 200)) return NextResponse.json({ ok: true });

  const name = str(body.name, 100);
  const email = str(body.email, 200).toLowerCase();
  const rawPhone = str(body.phone, 30);
  const organisation = str(body.organisation, 120);
  const topic: ContactTopic = isContactTopic(body.topic) ? body.topic : "general";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2) return fail("Enter your name.", 400, "name");
  if (!EMAIL.test(email)) return fail("Enter a valid email address.", 400, "email");
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) return fail(PHONE_HINT, 400, "phone");
  if (message.length < MESSAGE_MIN) {
    return fail(`Your message needs at least ${MESSAGE_MIN} characters.`, 400, "message");
  }
  if (message.length > MESSAGE_MAX) {
    return fail(`Keep your message under ${MESSAGE_MAX} characters.`, 400, "message");
  }

  if (storeEnabled) {
    const hour = Math.floor(Date.now() / 3_600_000);
    if ((await kv.incr(`gl:contact:${clientIp(req)}:${hour}`, 3600)) > 5) {
      return fail("You've sent several messages already. Please try again in an hour.", 429);
    }
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ...(phone ? ([["Phone", formatPhone(phone)]] as [string, string][]) : []),
    ...(organisation ? ([["Organisation", organisation]] as [string, string][]) : []),
    ["Topic", CONTACT_TOPICS[topic]],
  ];

  try {
    await sendEmail({
      to: CONTACT_TO,
      replyTo: email,
      subject: `[Contact] ${CONTACT_TOPICS[topic]} — ${name}`,
      text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${message}`,
      html: `<table cellpadding="4" style="font-family:sans-serif;font-size:14px">${rows
        .map(([k, v]) => `<tr><td style="color:#666">${k}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
        .join("")}</table><p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(
        message
      )}</p>`,
    });
  } catch (err) {
    console.error("Contact form email failed", err);
    return fail(`We couldn't send your message. Please email ${CONTACT_TO} instead.`, 502);
  }

  return NextResponse.json({ ok: true });
}
