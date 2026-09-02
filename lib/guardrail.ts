import type { CoordinatorLLMOutput, DomainVerdict, GuardrailResult } from "./types";

/**
 * The hard guardrail — plain code, not another prompt.
 *
 * This is the actual point of the demo: the coordinator LLM produces a finalStatus,
 * but if ANY domain agent came back "blocked", this function forces finalStatus to
 * "hold" regardless of what the LLM said, and records that the override happened.
 * A blocked constraint from Finance, People, or Product can never be silently
 * downgraded by the coordinator's own text.
 */
export function applyGuardrail(
  llmOutput: CoordinatorLLMOutput,
  domainVerdicts: DomainVerdict[]
): GuardrailResult {
  const blocked = domainVerdicts.filter((v) => v.status === "blocked");

  if (blocked.length === 0) {
    return {
      ...llmOutput,
      guardrailFired: false,
      guardrailNote: "No domain returned \"blocked\" — the coordinator's verdict stands as given.",
    };
  }

  const blockedNames = blocked.map((v) => v.domain).join(", ");

  if (llmOutput.finalStatus === "hold") {
    // The LLM already got it right; the guardrail still ran, it just didn't need to act.
    return {
      ...llmOutput,
      guardrailFired: false,
      guardrailNote: `${blockedNames} returned "blocked"; the coordinator's own verdict was already "hold", so no override was needed.`,
    };
  }

  // The LLM disagreed with a hard constraint — override it in code.
  return {
    finalStatus: "hold",
    summary: llmOutput.summary,
    contributingFactors: llmOutput.contributingFactors,
    guardrailFired: true,
    guardrailNote: `Overrode the coordinator's "${llmOutput.finalStatus}" verdict and forced "hold" because ${blockedNames} returned "blocked". A hard constraint like this is enforced in code and cannot be talked past by the model.`,
  };
}
