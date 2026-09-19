"use client";

import { useEffect, useState } from "react";

export default function DrawdownModule({ ticker }: { ticker: string }) {
    const [candles, setCandles] = useState<{ c: number }[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/quote/${ticker}/candles?range=1Y`)
            .then(res => res.json())
            .then(data => { if (!cancelled) setCandles(data.candles ?? data.bars ?? []); })
            .catch(() => { if (!cancelled) setCandles([]); });
        return () => { cancelled = true; };
    }, [ticker]);

    if (!candles || candles.length < 2) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Drawdown</h3>
                <p className="text-xs text-zinc-600">Not enough price history for this ticker.</p>
            </div>
        );
    }

    let peak = candles[0].c;
    const drawdowns = candles.map(c => {
        peak = Math.max(peak, c.c);
        return ((c.c - peak) / peak) * 100;
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
                    <div key={i} className="flex-1 bg-red-500/70" style={{ height: `${Math.abs(d / maxDD) * 100}%` }} />
                ))}
            </div>
        </div>
    );
}
