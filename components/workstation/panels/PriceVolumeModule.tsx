"use client";

import { useEffect, useState } from "react";

export default function PriceVolumeModule({ ticker }: { ticker: string }) {
    const [candles, setCandles] = useState<{ c: number; v: number; t: number }[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/quote/${ticker}/candles?range=3M`)
            .then(res => res.json())
            .then(data => { if (!cancelled) setCandles(data.candles ?? data.bars ?? []); })
            .catch(() => { if (!cancelled) setCandles([]); });
        return () => { cancelled = true; };
    }, [ticker]);

    if (!candles || candles.length < 2) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Price + Volume</h3>
                <p className="text-xs text-zinc-600">Not enough price history for this ticker.</p>
            </div>
        );
    }

    const maxPrice = Math.max(...candles.map(c => c.c));
    const minPrice = Math.min(...candles.map(c => c.c));
    const maxVol = Math.max(...candles.map(c => c.v), 1);
    const range = maxPrice - minPrice || 1;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Price + Volume</h3>
            <div className="relative h-28">
                <svg viewBox={`0 0 ${candles.length} 100`} preserveAspectRatio="none" className="h-full w-full">
                    <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="0.8"
                        vectorEffect="non-scaling-stroke"
                        points={candles.map((c, i) => `${i},${100 - ((c.c - minPrice) / range) * 100}`).join(" ")}
                    />
                </svg>
            </div>
            <div className="mt-1 flex h-8 items-end gap-px">
                {candles.map((c, i) => (
                    <div key={i} className="flex-1 bg-zinc-600" style={{ height: `${(c.v / maxVol) * 100}%` }} />
                ))}
            </div>
        </div>
    );
}
