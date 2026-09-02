import type { DomainVerdict } from "@/lib/types";
import StatusPill from "./StatusPill";

const ICONS: Record<DomainVerdict["domain"], string> = {
  finance: "💰",
  people: "🧑‍🤝‍🧑",
  product: "🧩",
};

const LABELS: Record<DomainVerdict["domain"], string> = {
  finance: "Finance",
  people: "People",
  product: "Product",
};

export default function DomainCard({ verdict }: { verdict: DomainVerdict }) {
  return (
    <div className="animate-fade-in flex flex-col gap-3 rounded-xl2 border border-teal-100 bg-white/80 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            {ICONS[verdict.domain]}
          </span>
          <h3 className="font-semibold text-ink">{LABELS[verdict.domain]}</h3>
        </div>
        <StatusPill status={verdict.status} />
      </div>
      <p className="text-sm leading-relaxed text-ink/80">{verdict.reason}</p>
      <p className="rounded-lg bg-teal-50/70 px-3 py-2 text-xs leading-relaxed text-teal-800">
        <span className="font-semibold">Evidence: </span>
        {verdict.evidence}
      </p>
    </div>
  );
}
