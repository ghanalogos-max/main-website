import { NextRequest, NextResponse } from "next/server";
import {
  AuthError,
  EMAIL,
  clientIp,
  createMagicToken,
  safeNext,
  siteOrigin,
} from "@/lib/auth";
import { accountForEmail } from "@/lib/developer";
import { emailDevMode, emailVerificationAvailable, sendEmail } from "@/lib/notify";
import { kv } from "@/lib/store";
import { emailButton, emailLayout } from "@/lib/email";
import { fail, unavailable } from "../../respond";

// Always answers the same way so it can't be used to discover accounts.
export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;
  if (!emailVerificationAvailable) {
    return NextResponse.json(
      { error: "Magic-link sign-in isn't available yet. Use your password or a receipt number." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const next = safeNext(body.next);
    if (!EMAIL.test(email)) throw new AuthError("Enter a valid email.");

    const hour = Math.floor(Date.now() / 3_600_000);
    if ((await kv.incr(`gl:magic:${clientIp(req)}:${hour}`, 3600)) > 5) {
      throw new AuthError("Too many requests. Try again in an hour.", 429);
    }

    let devLink: string | undefined;
    const account = await accountForEmail(email);
    if (account && (await kv.incr(`gl:magic:e:${email}`, 60)) === 1) {
      const token = await createMagicToken(account.id);
      const link = `${siteOrigin(req)}/api/auth/login/magic/callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
      await sendEmail({
        to: account.email,
        subject: "Sign in to GhanaLogos",
        text: `Hi ${account.name},\n\nSign in to GhanaLogos with this link (valid for 15 minutes):\n${link}\n\nIf you didn't ask for this, you can ignore this email.\n\nGhanaLogos — a Celestial Web Solutions product`,
        html: emailLayout(
          account.name,
          `<p style="margin:0 0 8px">Use this link to sign in to GhanaLogos. It expires in <strong>15 minutes</strong> and can only be used once.</p>
  ${emailButton(link, "Sign in to GhanaLogos")}
  <p style="margin:0;font-size:12px;color:#888888;word-break:break-all">Or paste this URL into your browser:<br /><a href="${link}" style="color:#006B3F">${link}</a></p>`
        ),
      });
      if (emailDevMode) devLink = link;
    }
    return NextResponse.json({ ok: true, devLink });
  } catch (err) {
    return fail(err);
  }
}
