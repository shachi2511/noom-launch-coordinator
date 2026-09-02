import type { GuardrailResult } from "@/lib/types";
import StatusPill from "./StatusPill";

export default function VerdictCard({ verdict }: { verdict: GuardrailResult }) {
  return (
    <div className="animate-fade-in rounded-xl2 border border-teal-200 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Final verdict</p>
          <div className="mt-2">
            <StatusPill status={verdict.finalStatus} size="lg" />
          </div>
        </div>
        {verdict.guardrailFired && (
          <div className="rounded-lg border border-coral-300 bg-coral-100 px-3 py-2 text-xs font-medium text-coral-700 sm:max-w-xs">
            ⚠ Guardrail override fired — see below
          </div>
        )}
      </div>

      <p className="mt-5 text-base leading-relaxed text-ink/90">{verdict.summary}</p>

      {verdict.contributingFactors.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Contributing factors</p>
          <ul className="mt-2 space-y-1.5">
            {verdict.contributingFactors.map((factor, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-400" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
