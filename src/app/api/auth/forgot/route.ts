import { NextRequest, NextResponse } from "next/server";
import { AuthError, EMAIL, clientIp, createResetToken, siteOrigin } from "@/lib/auth";
import { accountForEmail } from "@/lib/developer";
import { emailDevMode, emailVerificationAvailable, sendEmail } from "@/lib/notify";
import { kv } from "@/lib/store";
import { emailLayout } from "@/lib/verification";
import { fail, unavailable } from "../respond";

// Always answers the same way so it can't be used to discover accounts.
export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;
  if (!emailVerificationAvailable) {
    return NextResponse.json(
      { error: "Password reset isn't available yet. Sign in with your receipt number instead." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL.test(email)) throw new AuthError("Enter a valid email.");

    const hour = Math.floor(Date.now() / 3_600_000);
    if ((await kv.incr(`gl:forgot:${clientIp(req)}:${hour}`, 3600)) > 5) {
      throw new AuthError("Too many requests. Try again in an hour.", 429);
    }

    let devLink: string | undefined;
    const account = await accountForEmail(email);
    if (account && (await kv.incr(`gl:forgot:e:${email}`, 60)) === 1) {
      const link = `${siteOrigin(req)}/reset-password?token=${await createResetToken(account.id)}`;
      await sendEmail({
        to: account.email,
        subject: "Reset your GhanaLogos password",
        text: `Hi ${account.name},\n\nReset your GhanaLogos password with this link (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.\n\nGhanaLogos — a Celestial Web Solutions product`,
        html: emailLayout(
          account.name,
          `<p>We received a request to reset your GhanaLogos password.</p>
  <p style="margin:28px 0"><a href="${link}" style="background:#006b3f;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Reset password</a></p>
  <p style="color:#555">This link is valid for 1 hour. If you didn't ask for this, you can ignore this email — your password won't change.</p>`
        ),
      });
      if (emailDevMode) devLink = link;
    }
    return NextResponse.json({ ok: true, devLink });
  } catch (err) {
    return fail(err);
  }
}
