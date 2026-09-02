const STEPS = ["Finance Agent", "People Agent", "Product Agent", "Coordinator Agent"];

export default function LoadingAgents() {
  return (
    <div className="animate-fade-in rounded-xl2 border border-teal-100 bg-white/70 p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-300 border-t-teal-600" />
        <p className="text-sm font-medium text-ink/80">Checking with Finance, People, and Product…</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((step) => (
          <span
            key={step}
            className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
