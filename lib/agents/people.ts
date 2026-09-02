import { callClaudeStructured } from "../claude";
import type { DomainStatus, DomainVerdict } from "../types";

// Fabricated for this demo — not real Noom staffing data.
const PEOPLE_CONTEXT = `People team context (fictional demo data):
- Current coach-to-member ratio: 1 coach per 145 active members (target ceiling is 1:150).
- Coaching capacity headroom this month: roughly 3% before the ratio breaches target.
- Onboarding a new coach cohort takes about 5 weeks (background check, training, shadowing)
  before they can carry a full caseload.
- Any request expected to grow active membership by more than 8% in a single month, or that
  adds new coach headcount, needs a People sign-off before it's scheduled.
- Requests that don't touch member volume or headcount (e.g. a UI-only feature) are outside
  this team's remit and default to "clear" unless staffing is explicitly mentioned.`;

interface PeopleToolOutput {
  status: DomainStatus;
  reason: string;
  evidence: string;
}

function isPeopleToolOutput(obj: unknown): obj is PeopleToolOutput {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    (o.status === "clear" || o.status === "caution" || o.status === "blocked") &&
    typeof o.reason === "string" &&
    typeof o.evidence === "string"
  );
}

export async function runPeopleAgent(request: string): Promise<DomainVerdict> {
  const result = await callClaudeStructured<PeopleToolOutput>({
    system:
      "You are the People domain agent inside an internal cross-team launch coordinator at a health-coaching company. " +
      "You evaluate a plain-English request against your team's current coaching-capacity context only — you don't " +
      "know what Finance or Product think. Your reason and evidence must point to a specific number or constraint " +
      "from the context you were given. Use \"blocked\" only when the request plainly conflicts with a hard " +
      "capacity constraint; use \"caution\" when it's workable but tight or needs a heads-up; use \"clear\" when " +
      "nothing in your context stands in the way.",
    userMessage: `${PEOPLE_CONTEXT}\n\nRequest to evaluate: "${request}"\n\nDecide People's status on this request.`,
    toolName: "people_verdict",
    toolDescription: "Report the People team's verdict on the request, grounded in the staffing context provided.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["clear", "caution", "blocked"] },
        reason: { type: "string", description: "One sentence explaining the verdict." },
        evidence: { type: "string", description: "The specific fact from the People context that drove this answer." },
      },
      required: ["status", "reason", "evidence"],
      additionalProperties: false,
    },
    validate: isPeopleToolOutput,
  });

  return {
    domain: "people",
    status: result.status,
    reason: result.reason,
    evidence: result.evidence,
  };
}
