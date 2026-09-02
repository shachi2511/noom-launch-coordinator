import { NextRequest, NextResponse } from "next/server";
import { runFinanceAgent } from "@/lib/agents/finance";
import { runPeopleAgent } from "@/lib/agents/people";
import { runProductAgent } from "@/lib/agents/product";
import { callCoordinatorLLM } from "@/lib/agents/coordinator";
import { decideFinalVerdict } from "@/lib/coordinator";
import type { CoordinateResponse, DomainVerdict, TraceStep } from "@/lib/types";

export const runtime = "nodejs";

const DOMAIN_AGENTS: { label: string; run: (request: string) => Promise<DomainVerdict> }[] = [
  { label: "Finance Agent", run: runFinanceAgent },
  { label: "People Agent", run: runPeopleAgent },
  { label: "Product Agent", run: runProductAgent },
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const request = typeof body?.request === "string" ? body.request.trim() : "";

  if (!request) {
    return NextResponse.json({ error: "Tell us what your team wants to do first." }, { status: 400 });
  }

  const trace: TraceStep[] = [];
  const domainVerdicts: DomainVerdict[] = [];

  try {
    // Run the three domain agents in a fixed order so the trace reads as a clear sequence —
    // each one only ever sees the request, never the others' verdicts.
    let order = 1;
    for (const agent of DOMAIN_AGENTS) {
      const started = Date.now();
      const verdict = await agent.run(request);
      trace.push({
        order: order++,
        agent: agent.label,
        durationMs: Date.now() - started,
        rawOutput: verdict,
      });
      domainVerdicts.push(verdict);
    }

    const coordinatorStarted = Date.now();
    const verdict = await decideFinalVerdict(request, domainVerdicts, callCoordinatorLLM);
    trace.push({
      order: order++,
      agent: "Coordinator Agent",
      durationMs: Date.now() - coordinatorStarted,
      rawOutput: verdict,
      guardrailFired: verdict.guardrailFired,
    });

    const response: CoordinateResponse = { request, domainVerdicts, verdict, trace };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/coordinate] failed:", err);
    return NextResponse.json(
      {
        error:
          "One of the domain agents couldn't complete its review. This is usually a missing or invalid ANTHROPIC_API_KEY, or a temporary API hiccup — try again in a moment.",
      },
      { status: 502 }
    );
  }
}
