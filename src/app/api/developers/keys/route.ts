import { NextRequest, NextResponse } from "next/server";
import {
  accountSummary,
  createApiKey,
  getSessionAccount,
  revokeApiKey,
} from "@/lib/developer";
import { storeEnabled } from "@/lib/store";

async function requireAccount() {
  if (!storeEnabled) {
    return NextResponse.json({ error: "The developer API isn't available yet." }, { status: 503 });
  }
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in to manage API keys." }, { status: 401 });
  }
  return account;
}

// The plaintext key is only ever returned here, once.
export async function POST(req: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  const { name, website, allowLocalhost } = await req.json().catch(() => ({}));
  try {
    const { key } = await createApiKey(account, {
      name: typeof name === "string" ? name : "",
      website,
      allowLocalhost: allowLocalhost === true,
    });
    return NextResponse.json({ key, account: await accountSummary(account) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  const id = req.nextUrl.searchParams.get("id");
  try {
    await revokeApiKey(account, id ?? "");
    return NextResponse.json(await accountSummary(account));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}
