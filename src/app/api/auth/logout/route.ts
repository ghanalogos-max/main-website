import { NextResponse } from "next/server";
import { endSession } from "@/lib/developer";

export async function POST() {
  endSession();
  return NextResponse.json({ ok: true });
}
