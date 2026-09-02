import { callClaudeStructured } from "../claude";
import type { DomainStatus, DomainVerdict } from "../types";

// Fabricated for this demo — not real Noom product/engineering data.
const PRODUCT_CONTEXT = `Product team context (fictional demo data):
- The mobile app's notification service is mid-migration to a new provider; anything that
  depends on push notifications or in-app banners is unstable until the migration finishes,
  expected in about 3 weeks.
- The streak/habit-tracking feature is stable and fully rolled out to 100% of users.
- The GLP-1 medication-tracking module is in limited beta (12% of eligible users), gated
  behind a feature flag, and not yet approved for a full rollout.
- Any launch that requires a new user-facing screen or flow needs at least 1 week of QA
  after the last content change before it can ship broadly.
- Requests that don't touch the app or its infrastructure (e.g. a pure marketing message)
  are outside this team's remit and default to "clear" unless a specific feature is named.`;

interface ProductToolOutput {
  status: DomainStatus;
  reason: string;
  evidence: string;
}

function isProductToolOutput(obj: unknown): obj is ProductToolOutput {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    (o.status === "clear" || o.status === "caution" || o.status === "blocked") &&
    typeof o.reason === "string" &&
    typeof o.evidence === "string"
  );
}

export async function runProductAgent(request: string): Promise<DomainVerdict> {
  const result = await callClaudeStructured<ProductToolOutput>({
    system:
      "You are the Product domain agent inside an internal cross-team launch coordinator at a health-coaching " +
      "company. You evaluate a plain-English request against your team's current rollout/stability context only " +
      "— you don't know what Finance or People think. Your reason and evidence must point to a specific fact from " +
      "the context you were given. Use \"blocked\" only when the request plainly conflicts with a hard technical " +
      "or rollout constraint (e.g. asking to fully launch a feature that's still gated in limited beta); use " +
      "\"caution\" when it's workable but risky or needs more QA time; use \"clear\" when nothing in your context " +
      "stands in the way.",
    userMessage: `${PRODUCT_CONTEXT}\n\nRequest to evaluate: "${request}"\n\nDecide Product's status on this request.`,
    toolName: "product_verdict",
    toolDescription: "Report the Product team's verdict on the request, grounded in the rollout/stability context provided.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["clear", "caution", "blocked"] },
        reason: { type: "string", description: "One sentence explaining the verdict." },
        evidence: { type: "string", description: "The specific fact from the Product context that drove this answer." },
      },
      required: ["status", "reason", "evidence"],
      additionalProperties: false,
    },
    validate: isProductToolOutput,
  });

  return {
    domain: "product",
    status: result.status,
    reason: result.reason,
    evidence: result.evidence,
  };
}
