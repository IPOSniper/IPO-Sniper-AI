"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Point {
    date: string;
    close: number;
}

const RANGES = ["1M", "3M", "1Y"] as const;
type Range = typeof RANGES[number];

export default function PriceChart({ ticker }: { ticker: string }) {
    const [range, setRange] = useState<Range>("3M");
    const [points, setPoints] = useState<Point[]>([]);
    const [loading, setLoading] = useState(true);
    const [available, setAvailable] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        fetch(`/api/quote/${ticker}/candles?range=${range}`)
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                setPoints(data.points ?? []);
                setAvailable(data.available ?? false);
            })
            .catch(() => {
                if (!cancelled) setAvailable(false);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [ticker, range]);

    const isUp = points.length >= 2 && points[points.length - 1].close >= points[0].close;

    return (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-zinc-300">Price</h2>
                <div className="flex gap-1">
                    {RANGES.map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`text-xs px-2 py-1 rounded ${
                                range === r ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-48">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-xs text-zinc-600">Loading…</div>
                ) : !available || points.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-zinc-600">
                        Price history unavailable — check FINNHUB_API_KEY / plan access to /stock/candle.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                            <defs>
                                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isUp ? "#34d399" : "#f87171"} stopOpacity={0.35} />
                                    <stop offset="100%" stopColor={isUp ? "#34d399" : "#f87171"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide />
                            <YAxis domain={["auto", "auto"]} hide />
                            <Tooltip
                                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }}
                                labelStyle={{ color: "#a1a1aa" }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, "Close"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="close"
                                stroke={isUp ? "#34d399" : "#f87171"}
                                strokeWidth={1.5}
                                fill="url(#priceFill)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}
