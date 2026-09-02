// Shared types for the Cross-Team Launch Coordinator demo.

export type DomainName = "finance" | "people" | "product";

export type DomainStatus = "clear" | "caution" | "blocked";

export type FinalStatus = "go" | "hold" | "go_with_caution";

/** What each domain agent returns after evaluating a request against its team context. */
export interface DomainVerdict {
  domain: DomainName;
  status: DomainStatus;
  reason: string;
  evidence: string;
}

/** The raw shape the coordinator LLM call is asked to produce, before the guardrail runs. */
export interface CoordinatorLLMOutput {
  finalStatus: FinalStatus;
  summary: string;
  contributingFactors: string[];
}

/** The coordinator's output after the hard-coded guardrail has had a chance to override it. */
export interface GuardrailResult extends CoordinatorLLMOutput {
  /** True if the guardrail changed the LLM's finalStatus because a domain came back "blocked". */
  guardrailFired: boolean;
  /** Human-readable explanation of what the guardrail did, present whenever it ran a check. */
  guardrailNote: string;
}

/** One entry in the step-by-step observability trace shown in the "View reasoning trace" panel. */
export interface TraceStep {
  order: number;
  agent: string;
  durationMs: number;
  rawOutput: unknown;
  guardrailFired?: boolean;
}

/** Full response returned by POST /api/coordinate. */
export interface CoordinateResponse {
  request: string;
  domainVerdicts: DomainVerdict[];
  verdict: GuardrailResult;
  trace: TraceStep[];
}

export interface CoordinateErrorResponse {
  error: string;
}
