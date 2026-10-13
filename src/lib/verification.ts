import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { kv } from "./store";
import { notifyDevMode, sendEmail, sendSms } from "./notify";

const CODE_TTL = 10 * 60;
const MAX_ATTEMPTS = 5;

/** Normalises to international digits without "+", e.g. 233241234567. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^0\d{9}$/.test(digits)) digits = `233${digits.slice(1)}`;
  if (!/^\d{10,15}$/.test(digits)) return null;
  if (digits.startsWith("233") && !/^233[235]\d{8}$/.test(digits)) return null;
  return digits;
}

export function formatPhone(phone: string): string {
  const m = phone.match(/^233(\d{2})(\d{3})(\d{4})$/);
  return m ? `+233 ${m[1]} ${m[2]} ${m[3]}` : `+${phone}`;
}

export const PHONE_HINT = "Enter a valid phone number, e.g. 024 123 4567 or +233 24 123 4567.";

export class VerificationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

interface Pending<T> {
  payload: T;
  emailHash?: string;
  phoneHash?: string;
  attempts: number;
}

const hashCode = (token: string, code: string) =>
  createHash("sha256").update(`${token}:${code.replace(/\s/g, "")}`).digest();

const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

function matches(expectedHex: string | undefined, token: string, code: string): boolean {
  if (!expectedHex) return true;
  const given = hashCode(token, code);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

export function emailLayout(name: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0a0a0a">
  <p style="font-size:20px;font-weight:800">Ghana<span style="color:#ce1126">Logos</span></p>
  <p>Hi ${escapeHtml(name)},</p>
  ${body}
  <p style="color:#888;font-size:12px;margin-top:32px">GhanaLogos — a Celestial Web Solutions product</p>
</div>`;
}

async function throttle(ip: string, email?: string, phone?: string) {
  const hour = Math.floor(Date.now() / 3_600_000);
  if ((await kv.incr(`gl:vstart:${ip}:${hour}`, 3600)) > 6) {
    throw new VerificationError("Too many verification requests. Try again in an hour.", 429);
  }
  if (
    (email && (await kv.incr(`gl:vcool:e:${email}`, 60)) > 1) ||
    (phone && (await kv.incr(`gl:vcool:p:${phone}`, 60)) > 1)
  ) {
    throw new VerificationError("Please wait a minute before requesting new codes.", 429);
  }
}

export interface StartedVerification {
  token: string;
  devCodes?: { email?: string; phone?: string };
}

/**
 * Sends one-time codes to an email address and/or phone number and stores
 * `payload` until both codes are confirmed.
 */
export async function startVerification<T>(opts: {
  payload: T;
  name: string;
  email?: string;
  phone?: string;
  ip: string;
}): Promise<StartedVerification> {
  await throttle(opts.ip, opts.email, opts.phone);

  const token = randomBytes(18).toString("base64url");
  const emailCode = opts.email ? newCode() : undefined;
  const phoneCode = opts.phone ? newCode() : undefined;
  const pending: Pending<T> = {
    payload: opts.payload,
    emailHash: emailCode && hashCode(token, emailCode).toString("hex"),
    phoneHash: phoneCode && hashCode(token, phoneCode).toString("hex"),
    attempts: 0,
  };
  await kv.set(`gl:verify:${token}`, pending, CODE_TTL);

  try {
    await Promise.all([
      opts.email &&
        sendEmail({
          to: opts.email,
          subject: `${emailCode} is your GhanaLogos verification code`,
          text: `Hi ${opts.name},\n\nYour GhanaLogos verification code is ${emailCode}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.\n\nGhanaLogos — a Celestial Web Solutions product`,
          html: emailLayout(
            opts.name,
            `<p>Use this code to verify your email address:</p>
  <p style="font-size:32px;font-weight:800;letter-spacing:6px;margin:24px 0">${emailCode}</p>
  <p style="color:#555">It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`
          ),
        }),
      opts.phone &&
        sendSms({
          to: opts.phone,
          message: `${phoneCode} is your GhanaLogos verification code. It expires in 10 minutes.`,
        }),
    ]);
  } catch (err) {
    await kv.del(`gl:verify:${token}`);
    throw new VerificationError((err as Error).message, 502);
  }

  return {
    token,
    devCodes: notifyDevMode ? { email: emailCode, phone: phoneCode } : undefined,
  };
}

/** Checks the codes and returns the stored payload. Codes work once. */
export async function confirmVerification<T>(
  token: string,
  codes: { email?: string; phone?: string }
): Promise<T> {
  const key = `gl:verify:${token}`;
  const pending = await kv.get<Pending<T>>(key);
  if (!pending) {
    throw new VerificationError("These codes have expired. Request new ones.", 410);
  }

  const emailOk = matches(pending.emailHash, token, codes.email ?? "");
  const phoneOk = matches(pending.phoneHash, token, codes.phone ?? "");
  if (!emailOk || !phoneOk) {
    pending.attempts += 1;
    if (pending.attempts >= MAX_ATTEMPTS) {
      await kv.del(key);
      throw new VerificationError("Too many incorrect attempts. Request new codes.", 429);
    }
    await kv.set(key, pending, CODE_TTL);
    throw new VerificationError(
      !emailOk && !phoneOk
        ? "Both codes are incorrect."
        : !emailOk
          ? "The email code is incorrect."
          : "The SMS code is incorrect."
    );
  }

  await kv.del(key);
  return pending.payload;
}
