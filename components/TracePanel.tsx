"use client";

import { useState } from "react";
import type { GuardrailResult, TraceStep } from "@/lib/types";

export default function TracePanel({
  trace,
  verdict,
}: {
  trace: TraceStep[];
  verdict: GuardrailResult;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="animate-fade-in rounded-xl2 border border-teal-100 bg-white/70 shadow-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-ink">
          🔍 View reasoning trace
          <span className="ml-2 font-normal text-ink/50">
            {trace.length} step{trace.length === 1 ? "" : "s"}
            {verdict.guardrailFired ? " · guardrail fired" : ""}
          </span>
        </span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          ⌄
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-teal-100 px-5 pb-5 pt-4">
          {trace.map((step) => (
            <div key={step.order} className="rounded-lg border border-teal-100 bg-cream/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-teal-700">
                  Step {step.order} · {step.agent}
                </span>
                <span className="text-ink/50">{step.durationMs}ms</span>
              </div>
              {step.guardrailFired !== undefined && (
                <p className="mt-1 text-xs font-medium text-coral-700">
                  {step.guardrailFired ? "⚠ Guardrail override fired at this step" : "Guardrail checked, no override needed"}
                </p>
              )}
              <pre className="mt-2 overflow-x-auto rounded bg-ink/95 p-3 text-[11px] leading-relaxed text-teal-100">
                {JSON.stringify(step.rawOutput, null, 2)}
              </pre>
            </div>
          ))}

          <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
            <span className="font-semibold">Guardrail note: </span>
            {verdict.guardrailNote}
          </div>
        </div>
      )}
    </div>
  );
}
