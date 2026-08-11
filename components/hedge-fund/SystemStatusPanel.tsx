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

type StageStatus = "live" | "not-built";

interface Stage {
    name: string;
    status: StageStatus;
    detail: string;
}

const STAGES: Stage[] = [
    { name: "Research & Evidence Scoring", status: "live", detail: "Real — the AI Committee (14 analysts) scores every researched ticker against real evidence" },
    { name: "Strategy Generation", status: "not-built", detail: "No automated signal-generation loop exists yet — a human picks the ticker and order manually" },
    { name: "Risk Gatekeeper", status: "live", detail: "Real — RiskEngine checks every order against position size, concurrency, daily-loss, and cash-reserve limits before it reaches Alpaca" },
    { name: "Options Data & Execution", status: "live", detail: "Real — Alpaca options chain (strikes/IV/Greeks) + real order placement, sized at the correct 100x contract multiplier. No prediction/valuation/strategy layer built on top of it yet" },
    { name: "Portfolio Optimizer", status: "not-built", detail: "No automated rebalancing suggestions yet" },
    { name: "Paper Execution", status: "live", detail: "Real — connected to a live Alpaca paper-trading account" },
    { name: "Continuous / Scheduled Operation", status: "not-built", detail: "No scheduler wired in (needs Vercel Cron or a Supabase Scheduled Function) — everything above only runs when you're on this page" },
];

export default function SystemStatusPanel() {
    const liveCount = STAGES.filter(s => s.status === "live").length;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">System Status</h2>
                <span className="text-xs text-zinc-500">{liveCount} of {STAGES.length} stages live</span>
            </div>
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
