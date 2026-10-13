import { NextRequest, NextResponse } from "next/server";
import { AuthError, clientIp } from "@/lib/auth";
import { getSessionAccount } from "@/lib/developer";
import { verificationAvailable } from "@/lib/notify";
import { PHONE_HINT, formatPhone, normalizePhone, startVerification } from "@/lib/verification";
import { fail, unavailable } from "../../respond";

// Sends an SMS code to add or change the phone number on the signed-in account.
export async function POST(req: NextRequest) {
  const down = unavailable();
  if (down) return down;
  if (!verificationAvailable) {
    return NextResponse.json({ error: "Phone verification isn't available yet." }, { status: 503 });
  }

  try {
    const account = await getSessionAccount();
    if (!account) throw new AuthError("Sign in first.", 401);
    const { phone: raw } = await req.json().catch(() => ({}));
    const phone = typeof raw === "string" ? normalizePhone(raw) : null;
    if (!phone) throw new AuthError(PHONE_HINT);

    const { token, devCodes } = await startVerification({
      payload: { accountId: account.id, phone },
      name: account.name,
      phone,
      ip: clientIp(req),
    });
    return NextResponse.json({ token, phone: formatPhone(phone), devCode: devCodes?.phone });
  } catch (err) {
    return fail(err);
  }
}
