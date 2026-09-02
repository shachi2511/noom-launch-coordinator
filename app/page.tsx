"use client";

import { useState } from "react";
import type { CoordinateResponse } from "@/lib/types";
import DomainCard from "@/components/DomainCard";
import VerdictCard from "@/components/VerdictCard";
import TracePanel from "@/components/TracePanel";
import ExampleChips from "@/components/ExampleChips";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingAgents from "@/components/LoadingAgents";

export default function Home() {
  const [requestText, setRequestText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoordinateResponse | null>(null);

  async function runCoordinator(request: string) {
    const trimmed = request.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/coordinate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: trimmed }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || "error" in data) {
        setError(
          (data && "error" in data && data.error) ||
            "The coordinator couldn't complete this check. Please try again."
        );
        return;
      }

      setResult(data as CoordinateResponse);
    } catch {
      setError("Couldn't reach the coordinator. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runCoordinator(requestText);
  }

  function handleChipSelect(example: string) {
    setRequestText(example);
    runCoordinator(example);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-4 py-14 sm:px-6">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
          Concept prototype
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">Cross-Team Launch Coordinator</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink/70 sm:text-base">
          Welli answers member questions from one shared knowledge base. This checks a launch
          request against three teams that <em>don&apos;t</em> share context — Finance, People, and
          Product — and shows exactly how a single verdict gets assembled from them.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <div className="w-full rounded-xl2 border border-teal-200 bg-white p-2 shadow-soft sm:p-3">
          <label htmlFor="request" className="sr-only">
            What does your team want to do?
          </label>
          <textarea
            id="request"
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="What does your team want to do?"
            rows={2}
            className="w-full resize-none rounded-xl2 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none sm:text-base"
          />
          <div className="flex justify-end px-1 pb-1">
            <button
              type="submit"
              disabled={loading || !requestText.trim()}
              className="rounded-full bg-teal-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Checking…" : "Check with all teams"}
            </button>
          </div>
        </div>

        <ExampleChips onSelect={handleChipSelect} disabled={loading} />
      </form>

      <div className="flex flex-col gap-6">
        {loading && <LoadingAgents />}
        {error && !loading && <ErrorBanner message={error} />}

        {result && !loading && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {result.domainVerdicts.map((v) => (
                <DomainCard key={v.domain} verdict={v} />
              ))}
            </div>

            <VerdictCard verdict={result.verdict} />

            <TracePanel trace={result.trace} verdict={result.verdict} />
          </>
        )}
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-ink/40">
        Concept prototype by Shachi Shriwastava — built for a job application, not an official
        Noom product. All team context shown above is fabricated demo data.
      </footer>
    </main>
  );
}
