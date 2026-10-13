import { NextResponse } from "next/server";
import { sessionName } from "@/lib/developer";

export const dynamic = "force-dynamic";

export async function GET() {
  const name = sessionName();
  return NextResponse.json(
    { signedIn: Boolean(name), name },
    { headers: { "Cache-Control": "no-store" } }
  );
}
