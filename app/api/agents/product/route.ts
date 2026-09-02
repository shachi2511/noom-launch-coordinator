import { NextRequest, NextResponse } from "next/server";
import { runProductAgent } from "@/lib/agents/product";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const request = body?.request;
    if (typeof request !== "string" || !request.trim()) {
      return NextResponse.json({ error: "Missing 'request' string in body." }, { status: 400 });
    }
    const verdict = await runProductAgent(request);
    return NextResponse.json(verdict);
  } catch (err) {
    console.error("[/api/agents/product] failed:", err);
    return NextResponse.json({ error: "The Product agent hit a snag." }, { status: 502 });
  }
}
