import { NextRequest, NextResponse } from "next/server";
import { runFinanceAgent } from "@/lib/agents/finance";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const request = body?.request;
    if (typeof request !== "string" || !request.trim()) {
      return NextResponse.json({ error: "Missing 'request' string in body." }, { status: 400 });
    }
    const verdict = await runFinanceAgent(request);
    return NextResponse.json(verdict);
  } catch (err) {
    console.error("[/api/agents/finance] failed:", err);
    return NextResponse.json({ error: "The Finance agent hit a snag." }, { status: 502 });
  }
}
