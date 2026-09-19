"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface EarningsPoint {
    fiscalQuarter: string;
    fiscalYear: number;
    reportDate: string;
    actualEPS: number | null;
    estimatedEPS: number | null;
    actualRevenue: number | null;
    estimatedRevenue: number | null;
}

interface EarningsResponse {
    available: boolean;
    reason?: string;
    history?: EarningsPoint[];
}

function formatRevenue(value: number) {
    const abs = Math.abs(value);

    if (abs >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }

    if (abs >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1)}M`;
    }

    if (abs >= 1_000) {
        return `$${(value / 1_000).toFixed(1)}K`;
    }

    return `$${value.toLocaleString()}`;
}

function TooltipContent({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{
        dataKey?: string;
        value?: number | null;
    }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs shadow-xl">
            <div className="mb-2 font-semibold text-zinc-200">
                {label}
            </div>

            {payload.map((item) => {
                if (typeof item.value !== "number") return null;

                const isRevenue =
                    item.dataKey?.toLowerCase().includes("revenue");

                const label =
                    item.dataKey === "actualEPS"
                        ? "Actual EPS"
                        : item.dataKey === "estimatedEPS"
                            ? "Estimated EPS"
                            : item.dataKey === "actualRevenue"
                                ? "Actual Revenue"
                                : "Estimated Revenue";

                return (
                    <div
                        key={item.dataKey}
                        className="flex justify-between gap-6 py-0.5"
                    >
                        <span className="text-zinc-500">{label}</span>
                        <span className="font-medium text-zinc-200">
                            {isRevenue
                                ? formatRevenue(item.value)
                                : item.value.toFixed(2)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default function EarningsHistoryChart({
    ticker,
}: {
    ticker: string;
}) {
    const [response, setResponse] =
        useState<EarningsResponse | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch(`/api/earnings/history/${ticker}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((json: EarningsResponse) => {
                if (!cancelled) {
                    setResponse(json);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setResponse({
                        available: false,
                        reason:
                            "Unable to retrieve verified earnings history.",
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [ticker]);

    const history = useMemo(() => {
        if (
            !response?.available ||
            !Array.isArray(response.history)
        ) {
            return [];
        }

        return response.history
            .filter(
                (item) =>
                    item &&
                    item.fiscalYear &&
                    item.reportDate
            )
            .sort(
                (a, b) =>
                    new Date(a.reportDate).getTime() -
                    new Date(b.reportDate).getTime()
            )
            .map((item) => ({
                ...item,
                period:
                    `${item.fiscalQuarter} ${item.fiscalYear}`,
            }));
    }, [response]);

    if (!response) {
        return null;
    }

    if (!response.available || history.length === 0) {
        return (
            <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Earnings History
                </div>

                <p className="mt-2 text-xs text-zinc-600">
                    {response.reason ??
                        "No verified earnings history is available."}
                </p>
            </section>
        );
    }

    const epsCoverage = history.filter(
        (item) =>
            typeof item.actualEPS === "number" ||
            typeof item.estimatedEPS === "number"
    ).length;

    const revenueCoverage = history.filter(
        (item) =>
            typeof item.actualRevenue === "number" ||
            typeof item.estimatedRevenue === "number"
    ).length;

    return (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Earnings History
            </div>

            <p className="mt-1 mb-5 text-xs leading-5 text-zinc-600">
                Quarterly reported earnings compared with
                corresponding estimates using the available
                verified history.
            </p>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                <div>
                    <div className="mb-2 text-[11px] font-medium text-zinc-400">
                        EPS — Actual vs Estimate
                    </div>

                    <div className="h-[270px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={history}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    left: -20,
                                    bottom: 4,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(113,113,122,0.18)"
                                />

                                <XAxis
                                    dataKey="period"
                                    tick={{
                                        fill: "#71717a",
                                        fontSize: 9,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <YAxis
                                    tick={{
                                        fill: "#71717a",
                                        fontSize: 9,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <Tooltip
                                    content={<TooltipContent />}
                                />

                                <Legend
                                    wrapperStyle={{
                                        fontSize: 10,
                                    }}
                                />

                                <Bar
                                    dataKey="actualEPS"
                                    name="Actual EPS"
                                    fill="#10b981"
                                    radius={[3, 3, 0, 0]}
                                    maxBarSize={18}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="estimatedEPS"
                                    name="Estimated EPS"
                                    stroke="#a1a1aa"
                                    strokeWidth={2}
                                    strokeDasharray="4 3"
                                    dot={{ r: 2 }}
                                    connectNulls={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <div className="mb-2 text-[11px] font-medium text-zinc-400">
                        Revenue — Actual vs Estimate
                    </div>

                    <div className="h-[270px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={history}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    left: -8,
                                    bottom: 4,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(113,113,122,0.18)"
                                />

                                <XAxis
                                    dataKey="period"
                                    tick={{
                                        fill: "#71717a",
                                        fontSize: 9,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <YAxis
                                    tick={{
                                        fill: "#71717a",
                                        fontSize: 9,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) =>
                                        formatRevenue(Number(value))
                                    }
                                />

                                <Tooltip
                                    content={<TooltipContent />}
                                />

                                <Legend
                                    wrapperStyle={{
                                        fontSize: 10,
                                    }}
                                />

                                <Bar
                                    dataKey="actualRevenue"
                                    name="Actual Revenue"
                                    fill="#38bdf8"
                                    radius={[3, 3, 0, 0]}
                                    maxBarSize={18}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="estimatedRevenue"
                                    name="Estimated Revenue"
                                    stroke="#a1a1aa"
                                    strokeWidth={2}
                                    strokeDasharray="4 3"
                                    dot={{ r: 2 }}
                                    connectNulls={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-900 pt-3">

                <div>
                    <div className="text-[9px] uppercase tracking-wide text-zinc-600">
                        Quarters
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-300">
                        {history.length}
                    </div>
                </div>

                <div>
                    <div className="text-[9px] uppercase tracking-wide text-zinc-600">
                        EPS Coverage
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-300">
                        {epsCoverage}/{history.length}
                    </div>
                </div>

                <div>
                    <div className="text-[9px] uppercase tracking-wide text-zinc-600">
                        Revenue Coverage
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-300">
                        {revenueCoverage}/{history.length}
                    </div>
                </div>

            </div>

            <div className="mt-3 border-t border-zinc-900 pt-3">
                <p className="text-[10px] leading-4 text-zinc-600">
                    Values are rendered only from the existing
                    earnings-history response. Missing values remain
                    missing and are never replaced with placeholders.
                </p>
            </div>
        </section>
    );
}