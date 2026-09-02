import { callClaudeStructured } from "../claude";
import type { CoordinatorLLMOutput, DomainVerdict, FinalStatus } from "../types";

interface CoordinatorToolOutput {
  finalStatus: FinalStatus;
  summary: string;
  contributingFactors: string[];
}

function isCoordinatorToolOutput(obj: unknown): obj is CoordinatorToolOutput {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    (o.finalStatus === "go" || o.finalStatus === "hold" || o.finalStatus === "go_with_caution") &&
    typeof o.summary === "string" &&
    Array.isArray(o.contributingFactors) &&
    o.contributingFactors.every((f) => typeof f === "string")
  );
}

/**
 * Calls Claude to synthesize the three domain verdicts into one plain-English recommendation.
 *
 * Note this function's output is a *proposal*, not the final answer — lib/coordinator.ts
 * always runs it through the hard guardrail in lib/guardrail.ts before it reaches the UI.
 */
export async function callCoordinatorLLM(
  request: string,
  domainVerdicts: DomainVerdict[]
): Promise<CoordinatorLLMOutput> {
  const verdictSummary = domainVerdicts
    .map(
      (v) =>
        `- ${v.domain.toUpperCase()}: ${v.status} — ${v.reason} (evidence: ${v.evidence})`
    )
    .join("\n");

  const result = await callClaudeStructured<CoordinatorToolOutput>({
    system:
      "You are the Coordinator agent in an internal cross-team launch tool. Three domain agents — Finance, " +
      "People, and Product — have each independently evaluated a request against their own team's context, " +
      "without seeing each other's reasoning. Your job is to read all three verdicts and write a single, " +
      "plain-English recommendation a human can act on immediately. " +
      "Choose \"go\" if every domain is clear. Choose \"go_with_caution\" if at least one domain flagged " +
      "\"caution\" but none is \"blocked\". Choose \"hold\" if any domain is \"blocked\" — a blocked domain " +
      "is a hard stop and must never be recommended as go or go_with_caution, no matter how minor the other " +
      "domains look, because a separate code-level guardrail will enforce this regardless of what you choose.",
    userMessage: `Request: "${request}"\n\nDomain verdicts:\n${verdictSummary}\n\nProduce the final coordination verdict.`,
    toolName: "coordination_verdict",
    toolDescription: "Return the final cross-team coordination verdict synthesizing all three domain verdicts.",
    inputSchema: {
      type: "object",
      properties: {
        finalStatus: { type: "string", enum: ["go", "hold", "go_with_caution"] },
        summary: {
          type: "string",
          description: "2-3 plain-English sentences a human can read and act on immediately.",
        },
        contributingFactors: {
          type: "array",
          items: { type: "string" },
          description: "One short line per domain describing what influenced the decision.",
        },
      },
      required: ["finalStatus", "summary", "contributingFactors"],
      additionalProperties: false,
    },
    validate: isCoordinatorToolOutput,
    maxTokens: 1024,
  });

  return result;
}
