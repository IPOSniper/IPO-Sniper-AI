"use client";

import { useState } from "react";
import { runBatchScan, getDailySummary, type BatchRunResult, type DailySummary } from "@/app/(app)/hedge-fund/batch-scanner/actions";
import { DEFAULT_AUTO_EXECUTION_GATES } from "@/engine/quant/BatchScanner";

const OUTCOME_STYLE: Record<string, { label: string; color: string }> = {
    execute: { label: "✅ Execute", color: "text-emerald-400" },
    skip: { label: "⏸ Skip", color: "text-zinc-400" },
    reject: { label: "❌ Reject", color: "text-red-400" },
    wait: { label: "⏳ Wait", color: "text-amber-400" },
};

const DEFAULT_WATCHLIST = "RIOT, IREN, RKLB, KTOS, CLSK";

/**
 * Phase 2A of the Quant roadmap: real batch scan across a real
 * watchlist, real stricter auto-execution gates, real paper
 * execution for whatever clears every gate (capped at
 * maxAutoExecutionsThisRun). See BatchScanner.ts's docstring for the
 * two real, honest limitations (no open-interest/volume data; this
 * is a manual single-click run, not a persistent background
 * process) -- both stated here too, not just in code comments.
 */
export default function BatchScannerPanel() {
    const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
    const [maxTrades, setMaxTrades] = useState(DEFAULT_AUTO_EXECUTION_GATES.maxAutoExecutionsThisRun);
    const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [results, setResults] = useState<BatchRunResult[] | null>(null);
    const [summary, setSummary] = useState<DailySummary | null>(null);

    async function handleRun() {
        setStatus("running");
        setErrorMessage(null);
        setResults(null);

        try {
            const tickers = watchlist.split(",").map(t => t.trim()).filter(Boolean);
            const gates = { ...DEFAULT_AUTO_EXECUTION_GATES, maxAutoExecutionsThisRun: maxTrades };
            const runResults = await runBatchScan(tickers, gates);
            setResults(runResults);
            setSummary(await getDailySummary());
            setStatus("idle");
        } catch (err) {
            setStatus("error");
            setErrorMessage(err instanceof Error ? err.message : "Batch run failed.");
        }
    }

    const executedCount = results?.filter(r => r.executed).length ?? 0;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Batch Scanner</h2>
                <span className="text-xs text-violet-400">Phase 2A — Autonomous Batch Paper Trading</span>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
                Real trade plans built for every ticker below, evaluated against stricter auto-execution gates (real committee/evidence thresholds, real open-position count, real bid/ask spread, real portfolio-risk %). Only what clears every gate gets a real paper order — up to the run limit. This is a manual run, triggered by this click — not a background process (no scheduler is deployed; see System Status).
            </p>
            <p className="mb-3 text-[10px] text-amber-500">
                Real gap, not hidden: no open interest or trading volume data exists anywhere in this app yet — those real liquidity checks are NOT part of this gate, only bid/ask spread is.
            </p>

            <div className="mb-4 space-y-2">
                <div>
                    <label className="mb-1 block text-xs text-zinc-500">Watchlist (comma-separated)</label>
                    <input
                        value={watchlist}
                        onChange={e => setWatchlist(e.target.value)}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-500">Max auto-executions this run (kill switch)</label>
                    <input
                        type="number"
                        min={0}
                        max={10}
                        value={maxTrades}
                        onChange={e => setMaxTrades(Number(e.target.value))}
                        className="w-16 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleRun}
                    disabled={status === "running"}
                    className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                    {status === "running" ? "Scanning…" : "Run Batch Scan"}
                </button>
            </div>

            {status === "error" && <p className="text-sm text-red-400">{errorMessage}</p>}

            {results && (
                <div className="space-y-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <p className="text-xs text-zinc-400">
                            {executedCount} executed · {results.filter(r => r.outcome === "reject").length} rejected · {results.filter(r => r.outcome === "skip").length} skipped
                            {results.filter(r => r.outcome === "execute" && !r.executed).length > 0 && ` · ${results.filter(r => r.outcome === "execute" && !r.executed).length} passed gates but hit the run limit`}
                        </p>
                    </div>

                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-zinc-800 text-left text-zinc-500">
                                <th className="pb-2">Ticker</th>
                                <th className="pb-2">Decision</th>
                                <th className="pb-2">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r.ticker} className="border-b border-zinc-900">
                                    <td className="py-2 font-medium text-white">{r.ticker}</td>
                                    <td className={`py-2 font-medium ${OUTCOME_STYLE[r.outcome].color}`}>
                                        {r.executed ? "✅ Executed" : OUTCOME_STYLE[r.outcome].label}
                                    </td>
                                    <td className="py-2 text-zinc-400">{r.orderStatus ?? r.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {summary && (
                <div className="mt-4 rounded-lg border border-violet-900/40 bg-[#160B3D] p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-violet-300">Today&apos;s Real Decision Log (from Quant Memory)</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <p className="text-zinc-500">Total decisions</p>
                            <p className="text-white">{summary.totalDecisions}</p>
                        </div>
                        <div>
                            <p className="text-zinc-500">Trade plans formed</p>
                            <p className="text-white">{summary.tradesFormed}</p>
                        </div>
                        <div>
                            <p className="text-zinc-500">No trade</p>
                            <p className="text-white">{summary.noTrade}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
