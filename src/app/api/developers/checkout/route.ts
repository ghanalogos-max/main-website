import { NextRequest, NextResponse } from "next/server";
import { initializeTransaction, paystackEnabled } from "@/lib/paystack";
import { isBillingPeriod, isPaidApiPlan, planPriceGhs } from "@/lib/apiPlans";
import { API_PRODUCT, getSessionAccount } from "@/lib/developer";
import { siteOrigin } from "@/lib/auth";
import { storeEnabled } from "@/lib/store";

// Starts a Paystack checkout for an API plan on the signed-in account.
export async function POST(req: NextRequest) {
  if (!paystackEnabled || !storeEnabled) {
    return NextResponse.json(
      { error: "API payments are not available yet. Please try again later." },
      { status: 503 }
    );
  }

  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in to buy a plan." }, { status: 401 });
  }
  if (!account.phoneVerifiedAt) {
    return NextResponse.json(
      { error: "Verify your phone number in the dashboard before buying a plan." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { plan, period } = body;
  if (!isPaidApiPlan(plan)) {
    return NextResponse.json({ error: "Choose a plan." }, { status: 400 });
  }
  if (!isBillingPeriod(period)) {
    return NextResponse.json({ error: "Choose monthly or yearly billing." }, { status: 400 });
  }
  const organisation =
    account.organisation ??
    (typeof body.organisation === "string" ? body.organisation.trim().slice(0, 120) : "");
  if (plan !== "individual" && !organisation) {
    return NextResponse.json(
      { error: "Enter your team or organisation name." },
      { status: 400 }
    );
  }

  try {
    const { authorization_url } = await initializeTransaction({
      email: account.email,
      amountGhs: planPriceGhs(plan, period),
      callbackUrl: `${siteOrigin(req)}/api/developers/verify`,
      metadata: {
        product: API_PRODUCT,
        plan,
        period,
        account: account.id,
        organisation: organisation || undefined,
      },
    });
    return NextResponse.json({ url: authorization_url });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
