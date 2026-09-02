import { callClaudeStructured } from "../claude";
import type { DomainStatus, DomainVerdict } from "../types";

// Fabricated for this demo — not real Noom financial data.
const FINANCE_CONTEXT = `Finance team context (Q4, fictional demo data):
- Total quarterly marketing budget: $180,000. Already committed to live campaigns: $138,000.
- Remaining uncommitted marketing budget this quarter: $42,000.
- Any single new campaign or initiative requesting more than $15,000 in net-new spend
  requires VP Finance sign-off, which currently has a ~2 week turnaround.
- Two campaigns already approved are drawing down this same budget line through quarter end.
- Headcount-related asks (new hires, contractor spend) draw from a separate People budget,
  not this marketing line, unless the request explicitly mixes the two.`;

interface FinanceToolOutput {
  status: DomainStatus;
  reason: string;
  evidence: string;
}

function isFinanceToolOutput(obj: unknown): obj is FinanceToolOutput {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    (o.status === "clear" || o.status === "caution" || o.status === "blocked") &&
    typeof o.reason === "string" &&
    typeof o.evidence === "string"
  );
}

export async function runFinanceAgent(request: string): Promise<DomainVerdict> {
  const result = await callClaudeStructured<FinanceToolOutput>({
    system:
      "You are the Finance domain agent inside an internal cross-team launch coordinator at a health-coaching company. " +
      "You evaluate a plain-English request against your team's current budget context only — you don't know what " +
      "Product or People think. Be concise and concrete: your reason and evidence must point to a specific number or " +
      "constraint from the context you were given, not a vague generality. Use \"blocked\" only when the request " +
      "plainly conflicts with a hard constraint (like exceeding remaining budget without sign-off already in place); " +
      "use \"caution\" when it's workable but needs a heads-up or a process step; use \"clear\" when nothing in your " +
      "context stands in the way.",
    userMessage: `${FINANCE_CONTEXT}\n\nRequest to evaluate: "${request}"\n\nDecide Finance's status on this request.`,
    toolName: "finance_verdict",
    toolDescription: "Report the Finance team's verdict on the request, grounded in the budget context provided.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["clear", "caution", "blocked"] },
        reason: { type: "string", description: "One sentence explaining the verdict." },
        evidence: { type: "string", description: "The specific fact from the Finance context that drove this answer." },
      },
      required: ["status", "reason", "evidence"],
      additionalProperties: false,
    },
    validate: isFinanceToolOutput,
  });

  return {
    domain: "finance",
    status: result.status,
    reason: result.reason,
    evidence: result.evidence,
  };
}
