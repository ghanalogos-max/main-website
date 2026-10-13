import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const value = process.env.DOWNLOAD_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("DOWNLOAD_SECRET must be set in production");
  }
  return "ghanalogos-dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function seal(data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function unseal<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}
