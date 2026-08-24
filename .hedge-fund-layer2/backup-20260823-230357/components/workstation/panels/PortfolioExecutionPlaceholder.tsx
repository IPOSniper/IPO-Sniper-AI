"use client";

import { useEffect, useState } from "react";
import { getPortfolioExecutionSummary, type PortfolioExecutionSummary } from "@/app/(app)/hedge-fund/portfolio-execution-summary";

function fmtMoney(n: number | null): string {
    if (n === null) return "Unavailable";
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPercent(n: number | null): string {
    if (n === null) return "Unavailable";
    return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtCount(n: number | null): string {
    return n === null ? "Unavailable" : String(n);
}

function EquityCurveChart({ curve }: { curve: PortfolioExecutionSummary["equityCurve"] }) {
    if (!curve || curve.length < 2) {
        return <p className="flex h-24 items-center justify-center text-xs text-zinc-700">Equity curve unavailable</p>;
    }
    const values = curve.map(p => p.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = curve
        .map((p, i) => {
            const x = (i / (curve.length - 1)) * 200;
            const y = 55 - ((p.equity - min) / range) * 50;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    return (
        <svg viewBox="0 0 200 60" className="h-24 w-full">
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500" />
        </svg>
    );
}

export default function PortfolioExecutionPlaceholder() {
    const [summary, setSummary] = useState<PortfolioExecutionSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPortfolioExecutionSummary()
            .then(setSummary)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Portfolio</p>
                {loading || !summary ? (
                    <p className="mt-2 text-sm text-zinc-600">Loading...</p>
                ) : (
                    <>
                        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Equity</p>
                                <p className="text-zinc-300">{fmtMoney(summary.equity)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Day P&amp;L</p>
                                <p className={summary.dayPnlPercent !== null && summary.dayPnlPercent < 0 ? "text-red-400" : "text-emerald-400"}>
                                    {fmtPercent(summary.dayPnlPercent)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Total Return</p>
                                <p className="text-zinc-300">{fmtPercent(summary.totalReturnPercent)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Drawdown</p>
                                <p className="text-zinc-300">{fmtPercent(summary.drawdownPercent)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Cash</p>
                                <p className="text-zinc-300">{fmtMoney(summary.cash)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Buying Power</p>
                                <p className="text-zinc-300">{fmtMoney(summary.buyingPower)}</p>
                            </div>
                        </div>
                        <div className="mt-3 rounded border border-zinc-800 p-2">
                            <p className="mb-1 text-[10px] text-zinc-600">Equity Curve (1M)</p>
                            <EquityCurveChart curve={summary.equityCurve} />
                        </div>
                    </>
                )}
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Execution</p>
                {loading || !summary ? (
                    <p className="mt-2 text-sm text-zinc-600">Loading...</p>
                ) : (
                    <>
                        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Orders</p>
                                <p className="text-zinc-300">{fmtCount(summary.ordersCount)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Filled</p>
                                <p className="text-zinc-300">{fmtCount(summary.filledCount)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Open Positions</p>
                                <p className="text-zinc-300">{fmtCount(summary.positions.length)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Completed</p>
                                <p className="text-zinc-300">{fmtCount(summary.completedTrades)}</p>
                            </div>
                        </div>
                        <div className="mt-3 rounded border border-zinc-800 p-2">
                            <p className="mb-1 text-[10px] text-zinc-600">Open Positions</p>
                            {summary.positions.length === 0 ? (
                                <p className="text-xs text-zinc-700">No open positions.</p>
                            ) : (
                                <div className="space-y-1">
                                    {summary.positions.map(p => (
                                        <div key={p.ticker} className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-zinc-400">{p.ticker}</span>
                                            <span className="text-zinc-600">{p.qty} sh</span>
                                            <span className={p.unrealizedPl >= 0 ? "text-emerald-400" : "text-red-400"}>
                                                {p.unrealizedPl >= 0 ? "+" : ""}{p.unrealizedPlPercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}