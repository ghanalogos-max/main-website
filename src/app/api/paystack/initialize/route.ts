import { NextRequest, NextResponse } from "next/server";
import { initializePayment, paystackEnabled } from "@/lib/paystack";
import { isPlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  if (!paystackEnabled) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Please try again later." },
      { status: 503 }
    );
  }

  const { email, plan } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!isPlanId(plan)) {
    return NextResponse.json({ error: "Choose a plan." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  try {
    const { authorization_url } = await initializePayment({
      email,
      plan,
      callbackUrl: `${siteUrl}/api/paystack/verify`,
    });
    return NextResponse.json({ url: authorization_url });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
