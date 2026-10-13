import { NextResponse } from "next/server";
import { getQuotaStatus } from "@/lib/quota";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getQuotaStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
