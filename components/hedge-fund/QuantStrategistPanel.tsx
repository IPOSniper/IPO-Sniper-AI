"use client";

import { useState } from "react";
import { getTradePlan, executeTradePlan, type TradePlanResult } from "@/app/(app)/hedge-fund/quant-strategist/actions";

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
 * Phase 1 (trade plan) + Phase 2 (real contract selection) of the
 * Quant roadmap. Private (role-gated Hedge Fund page only).
 *
 * Execute is a real, explicit action -- reuses the exact same
 * placeOrder/RiskEngine path the manual order form uses (see
 * executeTradePlan in actions.ts). This is not an autonomous
 * execution loop; nothing submits without this click.
 */
export default function QuantStrategistPanel() {
    const [ticker, setTicker] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<TradePlanResult | null>(null);
    const [executeStatus, setExecuteStatus] = useState<"idle" | "executing" | "done" | "error">("idle");
    const [executeMessage, setExecuteMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage(null);
        setResult(null);
        setExecuteStatus("idle");
        setExecuteMessage(null);

        const response = await getTradePlan(ticker);
        if (response.success) {
            setResult(response.result);
            setStatus("idle");
        } else {
            setStatus("error");
            setErrorMessage(response.error);
        }
    }

    async function handleExecute() {
        if (!result?.selectedContract || !result.suggestedQty) return;
        setExecuteStatus("executing");
        setExecuteMessage(null);

        const planSummary = `${DIRECTION_LABEL[result.plan.direction]} on ${result.ticker}, ${result.plan.confidence}% committee confidence`;
        const response = await executeTradePlan(result.selectedContract.symbol, result.suggestedQty, planSummary);

        if (response.success && response.order) {
            setExecuteStatus("done");
            setExecuteMessage(`Order submitted: ${response.order.side} ${response.order.qty} ${response.order.ticker} (status: ${response.order.status})`);
        } else {
            setExecuteStatus("error");
            setExecuteMessage(response.error ?? "Order failed with no error message.");
        }
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Quant Strategist</h2>
                <span className="text-xs text-violet-400">Phase 1+2 — Decision + Contract Selection</span>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
                Converts the real AI Committee&apos;s output into a trade plan, then selects a real matching contract from the live Alpaca options chain. Standard DTE/Delta/risk parameters are real conventions, not AI-optimized for this ticker — see the panel below for what&apos;s derived vs. standard.
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
                        <span className="text-zinc-600">(News Analyst excluded)</span>
                    </div>

                    {result.plan.reasoning.length > 0 && (
                        <div className="mb-3 space-y-1">
                            {result.plan.reasoning.map((r, i) => (
                                <p key={i} className="text-xs leading-snug text-zinc-300">• {r}</p>
                            ))}
                        </div>
                    )}

                    {result.plan.direction !== "none" && (
                        <>
                            <div className="mb-3 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3 text-xs">
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

                            {/* Real Phase 2: an actual contract, selected from the live chain, or an honest "none found" */}
                            {result.selectedContract ? (
                                <div className="rounded-lg border border-violet-900/40 bg-[#160B3D] p-3">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-violet-300">AI-Selected Contract (real, from live chain)</p>
                                    <p className="mb-1 select-all rounded bg-zinc-900 px-1.5 py-1 font-mono text-[10px] text-zinc-300">
                                        {result.selectedContract.symbol}
                                    </p>
                                    <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <p className="text-zinc-500">Strike / Exp.</p>
                                            <p className="text-white">${result.selectedContract.strikePrice.toFixed(2)} · {result.selectedContract.expirationDate}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Delta</p>
                                            <p className="text-white">{result.selectedContract.delta?.toFixed(3) ?? "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Ask (est. cost)</p>
                                            <p className="text-white">
                                                {result.selectedContract.askPrice !== null ? `$${result.selectedContract.askPrice.toFixed(2)}` : "—"}
                                                {result.suggestedQty && result.selectedContract.askPrice !== null && (
                                                    <span className="text-zinc-500"> × {result.suggestedQty} = ${(result.selectedContract.askPrice * 100 * result.suggestedQty).toFixed(0)}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {result.suggestedQty && (
                                        <p className="mb-3 text-[10px] text-zinc-500">
                                            Suggested qty ({result.suggestedQty}) derived from real account equity (${result.accountEquity?.toLocaleString()}) × the standard {result.plan.suggestedMaxRiskPercent}% risk parameter above — RiskEngine still performs the real, final sizing check on Execute.
                                        </p>
                                    )}

                                    {executeStatus !== "done" && (
                                        <button
                                            type="button"
                                            onClick={handleExecute}
                                            disabled={executeStatus === "executing"}
                                            className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                                        >
                                            {executeStatus === "executing" ? "Submitting…" : "Execute (Paper Trade)"}
                                        </button>
                                    )}
                                    {executeMessage && (
                                        <p className={`mt-2 text-xs ${executeStatus === "error" ? "text-red-400" : "text-emerald-400"}`}>{executeMessage}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-zinc-600">
                                    No real contract in the live chain falls within the target DTE/Delta ranges above — no order can be suggested. This is honest, not an error: the plan&apos;s criteria may just not be available for this ticker right now.
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
