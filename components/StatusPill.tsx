import type { DomainStatus, FinalStatus } from "@/lib/types";

type Status = DomainStatus | FinalStatus;

const STYLES: Record<Status, string> = {
  clear: "bg-teal-100 text-teal-700",
  go: "bg-teal-100 text-teal-700",
  caution: "bg-amber-100 text-amber-700",
  go_with_caution: "bg-amber-100 text-amber-700",
  blocked: "bg-coral-100 text-coral-700",
  hold: "bg-coral-100 text-coral-700",
};

const LABELS: Record<Status, string> = {
  clear: "Clear",
  go: "Go",
  caution: "Caution",
  go_with_caution: "Go, with caution",
  blocked: "Blocked",
  hold: "Hold",
};

export default function StatusPill({ status, size = "sm" }: { status: Status; size?: "sm" | "lg" }) {
  const sizeClasses = size === "lg" ? "px-4 py-1.5 text-sm" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${sizeClasses} ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
