/**
 * The honest version of the mockup's "Strategy pipeline" with
 * animated Complete/Running/Queued stages and a scrolling execution
 * log. That mockup implies a 24/7 autonomous loop continuously
 * generating and evaluating strategies -- this app has no scheduler
 * or continuous-execution infrastructure (see docs/IPO_SNIPER_OS.md's
 * Runtime Infrastructure table: still Windows Task + localhost only).
 * Faking a "Running" status or an animated log for something that
 * isn't actually running would be exactly the kind of fabrication
 * this whole product's trust story is built against.
 *
 * So this shows the real status of each conceptual stage instead --
 * three are genuinely live (Evidence Scoring via the real AI
 * Committee, Risk Gatekeeper via the real RiskEngine, Paper
 * Execution via the real Alpaca connection), the rest are honestly
 * marked as not yet built. When a real scheduler exists, this
 * component is where "Running" would become true instead of asserted.
 */

"use client";

import { useState } from "react";

type StageStatus = "live" | "not-built";

interface Stage {
    name: string;
    status: StageStatus;
    detail: string;
}

const STAGES: Stage[] = [
    { name: "Research & Evidence Scoring", status: "live", detail: "Real — the AI Committee (14 analysts) scores every researched ticker against real evidence" },
    { name: "Strategy Generation (Quant Strategist)", status: "live", detail: "Real — rule-based trade plan (direction + standard risk parameters) from real committee output, PLUS real contract selection from the live Alpaca chain (now a genuinely shared engine — also used by manual trading's real 'Find Best Contract' tool, no committee gate required) and one-click paper execution through the same RiskEngine path as manual orders, PLUS batch scanning across a watchlist with stricter auto-execution gates (real committee/evidence thresholds, real portfolio position count, real bid/ask spread — no open interest or volume data exists in this app yet). Not a trained model — see QuantStrategist.ts / BatchScanner.ts" },
    { name: "Risk Gatekeeper", status: "live", detail: "Real — RiskEngine checks every order against position size, concurrency, daily-loss, and cash-reserve limits before it reaches Alpaca" },
    { name: "Options Data & Execution", status: "live", detail: "Real — Alpaca options chain (strikes/IV/Greeks) + real order placement, sized at the correct 100x contract multiplier. No prediction/valuation/strategy layer built on top of it yet" },
    { name: "Portfolio Optimizer", status: "not-built", detail: "No automated rebalancing suggestions yet. Real industry exposure tracking now exists (see Hedge Fund page) — RiskEngine does not yet gate on it, that's a separate next step" },
    { name: "Paper Execution", status: "live", detail: "Real — connected to a live Alpaca paper-trading account" },
    { name: "Continuous / Scheduled Operation", status: "not-built", detail: "No scheduler wired in (needs Vercel Cron or a Supabase Scheduled Function) — everything above only runs when you're on this page" },
];

export default function SystemStatusPanel() {
    const [expanded, setExpanded] = useState(false);
    const liveCount = STAGES.filter(s => s.status === "live").length;

    if (!expanded) {
        return (
            <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-zinc-700"
            >
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-white">System Status</span>
                    <span className="text-xs text-zinc-500">{liveCount}/{STAGES.length} live</span>
                </div>
                <div className="flex items-center gap-2">
                    {STAGES.map(stage => (
                        <span
                            key={stage.name}
                            title={stage.name}
                            className={`h-1.5 w-1.5 rounded-full ${stage.status === "live" ? "bg-emerald-500" : "bg-zinc-700"}`}
                        />
                    ))}
                    <span className="ml-2 text-xs text-zinc-600">Click for details</span>
                </div>
            </button>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <button
                type="button"
                onClick={() => setExpanded(false)}
                className="mb-3 flex w-full items-center justify-between text-left"
            >
                <h2 className="text-lg font-semibold text-white">System Status</h2>
                <span className="text-xs text-zinc-500">{liveCount} of {STAGES.length} stages live — click to collapse</span>
            </button>

            <p className="mb-4 text-xs text-zinc-500">
                What&apos;s actually running right now, not a simulated pipeline. Stages marked &ldquo;not built&rdquo; are real, honest gaps — not hidden.
            </p>
            <div className="space-y-2.5">
                {STAGES.map(stage => (
                    <div key={stage.name} className="flex items-start gap-3 border-b border-zinc-800 pb-2.5 last:border-0 last:pb-0">
                        <span
                            className={`mt-1 flex h-2 w-2 shrink-0 rounded-full ${
                                stage.status === "live" ? "bg-emerald-500" : "bg-zinc-600"
                            }`}
                        />
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-white">{stage.name}</span>
                                <span className={`text-xs font-medium ${stage.status === "live" ? "text-emerald-400" : "text-zinc-500"}`}>
                                    {stage.status === "live" ? "Live" : "Not built"}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-500">{stage.detail}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
