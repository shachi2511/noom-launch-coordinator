import { NextRequest, NextResponse } from "next/server";
import { runPeopleAgent } from "@/lib/agents/people";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const request = body?.request;
    if (typeof request !== "string" || !request.trim()) {
      return NextResponse.json({ error: "Missing 'request' string in body." }, { status: 400 });
    }
    const verdict = await runPeopleAgent(request);
    return NextResponse.json(verdict);
  } catch (err) {
    console.error("[/api/agents/people] failed:", err);
    return NextResponse.json({ error: "The People agent hit a snag." }, { status: 502 });
  }
}
