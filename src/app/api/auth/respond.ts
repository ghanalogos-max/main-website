import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { EmailTakenError } from "@/lib/developer";
import { storeEnabled } from "@/lib/store";
import { VerificationError } from "@/lib/verification";

export function fail(err: unknown) {
  const status =
    err instanceof AuthError || err instanceof VerificationError
      ? err.status
      : err instanceof EmailTakenError
        ? 409
        : 500;
  const message =
    status === 500 ? "Something went wrong. Please try again." : (err as Error).message;
  if (status === 500) console.error(err);
  return NextResponse.json({ error: message }, { status });
}

export function unavailable() {
  return storeEnabled
    ? null
    : NextResponse.json({ error: "Accounts aren't available yet. Please try again later." }, { status: 503 });
}
