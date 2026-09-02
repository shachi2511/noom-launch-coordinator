import { describe, expect, it } from "vitest";
import { applyGuardrail } from "../lib/guardrail";
import { decideFinalVerdict } from "../lib/coordinator";
import type { CoordinatorLLMOutput, DomainVerdict } from "../lib/types";

/**
 * Regression suite for the hard guardrail — the actual point of this prototype.
 *
 * These tests never call the real Anthropic API. Domain verdicts are supplied directly as
 * fixed fixtures, and the coordinator's LLM call is mocked via dependency injection
 * (decideFinalVerdict takes the LLM caller as a parameter). That keeps CI fast, free, and
 * deterministic, while still exercising the exact guardrail code path the API route uses.
 */

function verdict(domain: DomainVerdict["domain"], status: DomainVerdict["status"]): DomainVerdict {
  return {
    domain,
    status,
    reason: `${domain} says ${status}`,
    evidence: `fixture evidence for ${domain}`,
  };
}

function mockCoordinatorLLM(output: CoordinatorLLMOutput) {
  return async (_request: string, _verdicts: DomainVerdict[]) => output;
}

describe("applyGuardrail (pure function)", () => {
  it("1. all three domains clear -> finalStatus stays 'go'", () => {
    const verdicts = [verdict("finance", "clear"), verdict("people", "clear"), verdict("product", "clear")];
    const llmOutput: CoordinatorLLMOutput = { finalStatus: "go", summary: "All clear.", contributingFactors: [] };

    const result = applyGuardrail(llmOutput, verdicts);

    expect(result.finalStatus).toBe("go");
    expect(result.guardrailFired).toBe(false);
  });

  it("2. finance blocked, others clear -> forced to 'hold' even though the LLM said 'go'", () => {
    const verdicts = [verdict("finance", "blocked"), verdict("people", "clear"), verdict("product", "clear")];
    const llmOutput: CoordinatorLLMOutput = {
      finalStatus: "go", // deliberately wrong, to prove the override fires
      summary: "Looks fine to launch.",
      contributingFactors: [],
    };

    const result = applyGuardrail(llmOutput, verdicts);

    expect(result.finalStatus).toBe("hold");
    expect(result.guardrailFired).toBe(true);
    expect(result.guardrailNote).toMatch(/finance/i);
  });

  it("3. people caution only -> 'go_with_caution', not 'hold'", () => {
    const verdicts = [verdict("finance", "clear"), verdict("people", "caution"), verdict("product", "clear")];
    const llmOutput: CoordinatorLLMOutput = {
      finalStatus: "go_with_caution",
      summary: "Workable, but keep an eye on capacity.",
      contributingFactors: [],
    };

    const result = applyGuardrail(llmOutput, verdicts);

    expect(result.finalStatus).toBe("go_with_caution");
    expect(result.finalStatus).not.toBe("hold");
    expect(result.guardrailFired).toBe(false);
  });

  it("4. product blocked -> forced to 'hold' even if the coordinator's own text disagrees", () => {
    const verdicts = [verdict("finance", "clear"), verdict("people", "clear"), verdict("product", "blocked")];
    const llmOutput: CoordinatorLLMOutput = {
      finalStatus: "go_with_caution", // deliberately wrong
      summary: "Should be fine with a light caveat.",
      contributingFactors: [],
    };

    const result = applyGuardrail(llmOutput, verdicts);

    expect(result.finalStatus).toBe("hold");
    expect(result.guardrailFired).toBe(true);
    expect(result.guardrailNote).toMatch(/product/i);
  });

  it("5. all three caution -> 'go_with_caution'", () => {
    const verdicts = [verdict("finance", "caution"), verdict("people", "caution"), verdict("product", "caution")];
    const llmOutput: CoordinatorLLMOutput = {
      finalStatus: "go_with_caution",
      summary: "Every domain flagged something minor.",
      contributingFactors: [],
    };

    const result = applyGuardrail(llmOutput, verdicts);

    expect(result.finalStatus).toBe("go_with_caution");
    expect(result.guardrailFired).toBe(false);
  });

  it("6. multiple domains blocked (finance + product) -> 'hold', override fires once", () => {
    const verdicts = [verdict("finance", "blocked"), verdict("people", "caution"), verdict("product", "blocked")];
    const llmOutput: CoordinatorLLMOutput = {
      finalStatus: "go_with_caution", // deliberately wrong
      summary: "Mostly fine.",
      contributingFactors: [],
    };

    const result = applyGuardrail(llmOutput, verdicts);

    expect(result.finalStatus).toBe("hold");
    expect(result.guardrailFired).toBe(true);
    expect(result.guardrailNote).toMatch(/finance/i);
    expect(result.guardrailNote).toMatch(/product/i);
  });

  it("7. a domain is blocked but the LLM already said 'hold' -> guardrail does not need to fire", () => {
    const verdicts = [verdict("finance", "clear"), verdict("people", "clear"), verdict("product", "blocked")];
    const llmOutput: CoordinatorLLMOutput = {
      finalStatus: "hold", // already correct
      summary: "Product isn't ready for this yet.",
      contributingFactors: [],
    };

    const result = applyGuardrail(llmOutput, verdicts);

    expect(result.finalStatus).toBe("hold");
    expect(result.guardrailFired).toBe(false);
  });

  it("8. all three blocked -> 'hold', override fires against a 'go' claim", () => {
    const verdicts = [verdict("finance", "blocked"), verdict("people", "blocked"), verdict("product", "blocked")];
    const llmOutput: CoordinatorLLMOutput = {
      finalStatus: "go", // deliberately wrong
      summary: "Should be fine.",
      contributingFactors: [],
    };

    const result = applyGuardrail(llmOutput, verdicts);

    expect(result.finalStatus).toBe("hold");
    expect(result.guardrailFired).toBe(true);
  });
});

describe("decideFinalVerdict (orchestration with a mocked coordinator LLM)", () => {
  it("still enforces the guardrail when the LLM call is injected rather than called directly", async () => {
    const verdicts = [verdict("finance", "blocked"), verdict("people", "clear"), verdict("product", "clear")];
    const mockLLM = mockCoordinatorLLM({
      finalStatus: "go",
      summary: "This looks safe to ship.",
      contributingFactors: ["Finance: no concerns noted"],
    });

    const result = await decideFinalVerdict("launch something", verdicts, mockLLM);

    expect(result.finalStatus).toBe("hold");
    expect(result.guardrailFired).toBe(true);
  });

  it("passes through a correct 'go' verdict untouched when nothing is blocked", async () => {
    const verdicts = [verdict("finance", "clear"), verdict("people", "clear"), verdict("product", "clear")];
    const mockLLM = mockCoordinatorLLM({
      finalStatus: "go",
      summary: "All three domains are clear.",
      contributingFactors: ["Finance: clear", "People: clear", "Product: clear"],
    });

    const result = await decideFinalVerdict("launch something", verdicts, mockLLM);

    expect(result.finalStatus).toBe("go");
    expect(result.guardrailFired).toBe(false);
    expect(result.contributingFactors).toHaveLength(3);
  });
});
