"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

export interface ResearchTargetProps {
  defaultTicker?: string;
}

export default function ResearchTarget({ defaultTicker }: ResearchTargetProps) {
  const router = useRouter();
  const [ticker, setTicker] = useState(defaultTicker ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleaned = ticker.trim().toUpperCase();

    if (!cleaned) {
      setError("Enter a ticker symbol to analyze.");
      return;
    }

    if (!/^[A-Z.]{1,10}$/.test(cleaned)) {
      setError("That doesn't look like a valid ticker.");
      return;
    }

    setError(null);
    setSubmitting(true);

    router.push(`/research/${cleaned}`);
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Research Target</h2>
        <span className="text-xs text-zinc-500">
          {submitting ? "ANALYZING" : "READY"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Enter ticker (e.g. AAPL)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm uppercase outline-none focus:border-violet-400"
            disabled={submitting}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing…
            </>
          ) : (
            "Analyze"
          )}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </section>
  );
}
