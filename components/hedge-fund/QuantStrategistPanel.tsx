"use client";

import { useState } from "react";
import { getTradePlan } from "@/app/(app)/hedge-fund/quant-strategist/actions";
import type { TradePlan } from "@/engine/quant/QuantStrategist";

const DIRECTION_LABEL: Record<string, string> = {
    call: "Long Call",
    put: "Long Put",
    none: "No Trade",
};

const DIRECTION_COLOR: Record<string, string> = {
    call: "text-emerald-400",
    put: "text-red-400",
    none: "text-zinc-400",
};

/**
 * Phase 1 of the Quant roadmap -- real committee data in, a
 * structured trade plan out. Deliberately private (this file lives
 * under components/hedge-fund/, the role-gated area, not the public
 * workstation). No contract selection here -- see
 * QuantStrategist.ts's docstring for why that's a separate phase.
 */
export default function QuantStrategistPanel() {
    const [ticker, setTicker] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<{ ticker: string; plan: TradePlan } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage(null);
        setResult(null);

        const response = await getTradePlan(ticker);
        if (response.success) {
            setResult({ ticker: response.ticker, plan: response.plan });
            setStatus("idle");
        } else {
            setStatus("error");
            setErrorMessage(response.error);
        }
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Quant Strategist</h2>
                <span className="text-xs text-violet-400">Phase 1 — Decision Engine</span>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
                Converts the real AI Committee&apos;s output into a structured trade plan — direction and real committee confidence, plus standard options-trading risk parameters (not AI-optimized for this specific ticker — see the reasoning below for what&apos;s actually derived vs. a standard default). No contract is selected here.
            </p>

            <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
                <input
                    value={ticker}
                    onChange={e => setTicker(e.target.value)}
                    placeholder="RIOT"
                    className="w-32 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                    required
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                    {status === "loading" ? "Researching…" : "Build Trade Plan"}
                </button>
            </form>

            {status === "error" && <p className="text-sm text-red-400">{errorMessage}</p>}

            {result && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-zinc-400">{result.ticker}</span>
                        <span className={`text-lg font-bold ${DIRECTION_COLOR[result.plan.direction]}`}>
                            {DIRECTION_LABEL[result.plan.direction]}
                        </span>
                    </div>

                    <div className="mb-3 flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">Committee confidence</span>
                        <span className="font-semibold text-white">{result.plan.confidence}%</span>
                        <span className="text-zinc-600">(News Analyst excluded — same rule as everywhere else in this app)</span>
                    </div>

                    {result.plan.reasoning.length > 0 && (
                        <div className="mb-3 space-y-1">
                            {result.plan.reasoning.map((r, i) => (
                                <p key={i} className="text-xs leading-snug text-zinc-300">• {r}</p>
                            ))}
                        </div>
                    )}

                    {result.plan.direction !== "none" && (
                        <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3 text-xs">
                            <div>
                                <p className="text-zinc-500">Target DTE (standard)</p>
                                <p className="text-white">{result.plan.targetDteRange?.[0]}–{result.plan.targetDteRange?.[1]} days</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Target Delta (standard)</p>
                                <p className="text-white">{result.plan.targetDeltaRange?.[0].toFixed(2)}–{result.plan.targetDeltaRange?.[1].toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Suggested max risk (standard)</p>
                                <p className="text-white">{result.plan.suggestedMaxRiskPercent}% of portfolio</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Profit target / stop (standard)</p>
                                <p className="text-white">+{result.plan.profitTargetPercent}% / -{result.plan.stopLossPercent}%</p>
                            </div>
                        </div>
                    )}

                    <p className="mt-3 text-[10px] text-zinc-600">
                        Phase 1 output only — no contract selected, no order placed. The DTE/Delta/risk numbers above are standard options-trading conventions, not values computed specifically for this situation. RiskEngine still performs the real, portfolio-specific sizing check before any order reaches Alpaca.
                    </p>
                </div>
            )}
        </div>
    );
}
