import { NextRequest, NextResponse } from "next/server";
import { EMAIL, clientIp } from "@/lib/auth";
import { createSubmission, submissionsEnabled } from "@/lib/sanity.client";
import { kv, storeEnabled } from "@/lib/store";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = /\.(svg|png)$/i;

function text(form: FormData, name: string, max: number): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  if (!submissionsEnabled) {
    return fail("Submissions aren't available right now. Please try again later.", 503);
  }

  if (storeEnabled) {
    const hour = Math.floor(Date.now() / 3_600_000);
    if ((await kv.incr(`gl:submit:${clientIp(req)}:${hour}`, 3600)) > 10) {
      return fail("Too many submissions. Please try again in an hour.", 429);
    }
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid form data.");
  }

  const companyName = text(form, "companyName", 120);
  const submitterName = text(form, "submitterName", 100);
  const submitterEmail = text(form, "submitterEmail", 200).toLowerCase();
  const sourceUrl = text(form, "sourceUrl", 500);
  const file = form.get("file");

  if (!companyName) return fail("Enter the company name.");
  if (!submitterName) return fail("Enter your name.");
  if (!EMAIL.test(submitterEmail)) return fail("Enter a valid email address.");
  if (sourceUrl && !/^https?:\/\/\S+$/i.test(sourceUrl)) {
    return fail("The source link must start with http:// or https://.");
  }
  if (!(file instanceof File) || file.size === 0) return fail("Choose a logo file to upload.");
  if (!ALLOWED.test(file.name)) return fail("The logo must be an SVG or PNG file.");
  if (file.size > MAX_BYTES) return fail("The logo file must be 5MB or smaller.");

  try {
    await createSubmission({
      companyName,
      submitterName,
      submitterEmail,
      sourceUrl: sourceUrl || undefined,
      file,
    });
  } catch (err) {
    console.error("Logo submission failed", err);
    return fail("We couldn't save your submission. Please try again.", 502);
  }

  return NextResponse.json({ ok: true });
}
