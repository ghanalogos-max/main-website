// Outbound email (Resend) and SMS (Arkesel) used for sign-up verification.
const resendKey = process.env.RESEND_API_KEY;
const arkeselKey = process.env.ARKESEL_API_KEY;

export const emailEnabled = Boolean(resendKey);
export const smsEnabled = Boolean(arkeselKey);

/**
 * Without providers, codes are printed to the server log instead of being
 * sent. Only allowed outside production or with the in-memory test store.
 */
export const notifyDevMode =
  (!emailEnabled || !smsEnabled) &&
  (process.env.NODE_ENV !== "production" || process.env.API_STORE === "memory");

export const verificationAvailable = (emailEnabled && smsEnabled) || notifyDevMode;

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
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
      from: process.env.EMAIL_FROM || "GhanaLogos <no-reply@ghanalogos.com>",
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
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
