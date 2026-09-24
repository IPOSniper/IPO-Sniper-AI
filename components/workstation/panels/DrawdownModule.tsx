"use client";

import { useEffect, useState } from "react";

interface Point {
    date: string;
    close: number;
}

export default function DrawdownModule({ ticker }: { ticker: string }) {
    const [points, setPoints] = useState<Point[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/quote/${ticker}/candles?range=1Y`)
            .then(res => res.json())
            .then(data => { if (!cancelled) setPoints(data.points ?? []); })
            .catch(() => { if (!cancelled) setPoints([]); });
        return () => { cancelled = true; };
    }, [ticker]);

    if (!points || points.length < 2) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Drawdown</h3>
                <p className="text-xs text-zinc-600">Not enough price history for this ticker.</p>
            </div>
        );
    }

    let peak = points[0].close;
    const drawdowns = points.map(p => {
        peak = Math.max(peak, p.close);
        return ((p.close - peak) / peak) * 100;
    });
    const maxDD = Math.min(...drawdowns);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Drawdown</h3>
                <span className="text-[10px] text-red-400">Max: {maxDD.toFixed(1)}%</span>
            </div>
            <div className="flex h-16 items-end gap-px">
                {drawdowns.map((d, i) => (
                    <div key={i} className="flex-1 bg-red-500/70" style={{ height: `${maxDD === 0 ? 0 : Math.abs(d / maxDD) * 100}%` }} />
                ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
                Drawdown shows how far the price has fallen from its highest point so far in this window. Max Drawdown ({maxDD.toFixed(1)}%) is the single worst peak-to-trough decline over the last year -- a rough gauge of how much downside risk this stock has actually shown, not a prediction of future risk.
            </p>
        </div>
    );
}