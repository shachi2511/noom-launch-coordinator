import { applyGuardrail } from "./guardrail";
import type { CoordinatorLLMOutput, DomainVerdict, GuardrailResult } from "./types";

export type CoordinatorLLMCaller = (
  request: string,
  domainVerdicts: DomainVerdict[]
) => Promise<CoordinatorLLMOutput>;

/**
 * Orchestrates the coordinator step: calls the (injected) LLM caller to get a proposed
 * verdict, then always runs it through the hard guardrail before returning.
 *
 * The LLM caller is passed in rather than imported directly so this function — the piece
 * that matters for the eval suite — can be unit-tested with a mocked coordinator response
 * and fixed domain verdicts, with zero network calls.
 */
export async function decideFinalVerdict(
  request: string,
  domainVerdicts: DomainVerdict[],
  callCoordinatorLLM: CoordinatorLLMCaller
): Promise<GuardrailResult> {
  const llmOutput = await callCoordinatorLLM(request, domainVerdicts);
  return applyGuardrail(llmOutput, domainVerdicts);
}
