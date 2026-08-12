"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { getEquityCurve } from "@/app/(app)/hedge-fund/equity-curve/actions";
import type { PortfolioHistoryPoint } from "@/engine/trading/contracts/TradeOrder";

const PERIODS = [
    { label: "1W", period: "1W", timeframe: "1H" },
    { label: "1M", period: "1M", timeframe: "1D" },
    { label: "3M", period: "3M", timeframe: "1D" },
    { label: "1Y", period: "1A", timeframe: "1D" },
];

/**
 * Real portfolio equity curve -- Alpaca's own tracked history of
 * this real paper account's real equity over time, not estimated or
 * reconstructed from order history. See AlpacaPaperTradingProvider.
 * getPortfolioHistory()'s docstring for the real endpoint and the
 * timestamp-unit ambiguity handled defensively there.
 *
 * Real summary metrics shown alongside the chart: total return
 * (first point to last point in the real series), win rate is
 * deliberately NOT shown here -- that needs real per-trade outcome
 * data (entry vs exit), which doesn't exist yet (see
 * quant_trade_decisions' docstring on why outcome tracking is a
 * separate, later piece). An equity curve answers "is the account
 * growing," not "how good are individual trades" -- those are
 * different real questions needing different real data.
 */
export default function EquityCurvePanel() {
    const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[1]);
    const [data, setData] = useState<PortfolioHistoryPoint[] | null>(null);
    const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

    useEffect(() => {
        setStatus("loading");
        getEquityCurve(selectedPeriod.period, selectedPeriod.timeframe).then(result => {
            setData(result);
            setStatus(result === null ? "error" : "idle");
        });
    }, [selectedPeriod]);

    const chartData = data?.map(p => ({
        date: new Date(p.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        equity: p.equity,
    })) ?? [];

    const firstEquity = data && data.length > 0 ? data[0].equity : null;
    const lastEquity = data && data.length > 0 ? data[data.length - 1].equity : null;
    const totalReturn = firstEquity && lastEquity && firstEquity !== 0
        ? ((lastEquity - firstEquity) / firstEquity) * 100
        : null;

    const maxEquity = data && data.length > 0 ? Math.max(...data.map(p => p.equity)) : null;
    const minAfterMax = data && maxEquity !== null
        ? Math.min(...data.slice(data.findIndex(p => p.equity === maxEquity)).map(p => p.equity))
        : null;
    const maxDrawdown = maxEquity && minAfterMax && maxEquity !== 0
        ? ((minAfterMax - maxEquity) / maxEquity) * 100
        : null;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Portfolio Equity Curve</h2>
                    <p className="text-[10px] text-zinc-600">Real Alpaca portfolio history — the account's own tracked equity over time</p>
                </div>
                <div className="flex gap-1">
                    {PERIODS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => setSelectedPeriod(p)}
                            className={`rounded px-2 py-1 text-xs ${selectedPeriod.label === p.label ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {status === "loading" && <p className="py-8 text-center text-sm text-zinc-600">Loading real equity history…</p>}
            {status === "error" && <p className="py-8 text-center text-sm text-red-400">Could not load real portfolio history from Alpaca.</p>}

            {status === "idle" && data && data.length === 0 && (
                <p className="py-8 text-center text-sm text-zinc-600">No portfolio history yet for this period — the account may be too new.</p>
            )}

            {status === "idle" && data && data.length > 0 && (
                <>
                    <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
                        <div>
                            <p className="text-zinc-500">Current Equity</p>
                            <p className="text-white">${lastEquity?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p className="text-zinc-500">Return ({selectedPeriod.label})</p>
                            <p className={totalReturn !== null && totalReturn >= 0 ? "text-emerald-400" : "text-red-400"}>
                                {totalReturn !== null ? `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%` : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-zinc-500">Max Drawdown</p>
                            <p className="text-red-400">{maxDrawdown !== null ? `${maxDrawdown.toFixed(2)}%` : "—"}</p>
                        </div>
                        <div>
                            <p className="text-zinc-500">Data Points</p>
                            <p className="text-white">{data.length}</p>
                        </div>
                    </div>

                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={v => typeof v === "number" ? `$${(v / 1000).toFixed(0)}k` : String(v)} />
                                {firstEquity !== null && <ReferenceLine y={firstEquity} stroke="#3F3F46" strokeDasharray="3 3" />}
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#18181B", border: "1px solid #3F3F46", fontSize: 12 }}
                                    formatter={(value) => [typeof value === "number" ? `$${value.toLocaleString()}` : String(value ?? "—"), "Equity"]}
                                />
                                <Line type="monotone" dataKey="equity" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}
