import { NextRequest, NextResponse } from "next/server";
import { paystackEnabled, premiumFromReference } from "@/lib/paystack";
import { getQuotaStatus, setPremium } from "@/lib/quota";

export async function POST(req: NextRequest) {
  if (!paystackEnabled) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 }
    );
  }

  const { reference } = await req.json().catch(() => ({}));
  if (typeof reference !== "string" || !reference.trim()) {
    return NextResponse.json(
      { error: "Enter your Paystack payment reference." },
      { status: 400 }
    );
  }

  try {
    setPremium(await premiumFromReference(reference.trim()));
    return NextResponse.json(await getQuotaStatus());
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
