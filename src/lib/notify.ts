// Outbound email (Resend) and SMS (Arkesel).
const resendKey = process.env.RESEND_API_KEY;
const arkeselKey = process.env.ARKESEL_API_KEY;

export const emailEnabled = Boolean(resendKey);
export const smsEnabled = Boolean(arkeselKey);

/**
 * Without a provider, codes/links are printed to the server log instead of
 * being sent. Only allowed outside production or with the in-memory test store.
 */
const allowDevFallback =
  process.env.NODE_ENV !== "production" || process.env.API_STORE === "memory";

export const emailDevMode = !emailEnabled && allowDevFallback;
export const smsDevMode = !smsEnabled && allowDevFallback;

/** True when email or SMS falls back to logging (local/dev). */
export const notifyDevMode = emailDevMode || smsDevMode;

export const emailVerificationAvailable = emailEnabled || emailDevMode;
export const smsVerificationAvailable = smsEnabled || smsDevMode;

/**
 * Re-enable SMS OTP on email sign-up when Arkesel is ready.
 * Account phone verification for contributors is separate and uses SMS always.
 */
export const signupSmsEnabled =
  process.env.ENABLE_SIGNUP_SMS === "1" && smsVerificationAvailable;

/** @deprecated Prefer emailVerificationAvailable / smsVerificationAvailable. */
export const verificationAvailable = emailVerificationAvailable && smsVerificationAvailable;

const DEFAULT_FROM = "GhanaLogos <no-reply@ghanalogos.com>";

/** Dashboard-pasted values often carry quotes or stray whitespace, which Resend rejects. */
function emailFrom() {
  const raw = (process.env.EMAIL_FROM || "").trim().replace(/^["']+|["']+$/g, "").trim();
  if (/^[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+$/.test(raw)) return raw;
  if (/^[^<>"]+\s*<[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+>$/.test(raw)) return raw;
  if (raw) console.warn("EMAIL_FROM is not a valid sender; using the default.");
  return DEFAULT_FROM;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  if (!emailEnabled) {
    console.info(`[dev email] to=${opts.to} subject="${opts.subject}"\n${opts.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "We couldn't send the verification email.");
  }
}

export async function sendSms(opts: { to: string; message: string }) {
  if (!smsEnabled) {
    console.info(`[dev sms] to=${opts.to}\n${opts.message}`);
    return;
  }
  const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
    method: "POST",
    headers: { "api-key": arkeselKey!, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: process.env.SMS_SENDER_ID || "GhanaLogos",
      message: opts.message,
      recipients: [opts.to],
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status !== "success") {
    throw new Error("We couldn't send the SMS code. Check the phone number.");
  }
}
