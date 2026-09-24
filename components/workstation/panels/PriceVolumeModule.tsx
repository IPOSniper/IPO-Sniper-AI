"use client";

import { useEffect, useState } from "react";

interface Point {
    date: string;
    close: number;
    volume: number | null;
}

export default function PriceVolumeModule({ ticker }: { ticker: string }) {
    const [points, setPoints] = useState<Point[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/quote/${ticker}/candles?range=3M`)
            .then(res => res.json())
            .then(data => { if (!cancelled) setPoints(data.points ?? []); })
            .catch(() => { if (!cancelled) setPoints([]); });
        return () => { cancelled = true; };
    }, [ticker]);

    const hasVolume = points !== null && points.some(p => p.volume !== null);

    if (!points || points.length < 2) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Price + Volume</h3>
                <p className="text-xs text-zinc-600">Not enough price history for this ticker.</p>
            </div>
        );
    }

    const maxPrice = Math.max(...points.map(p => p.close));
    const minPrice = Math.min(...points.map(p => p.close));
    const maxVol = Math.max(...points.map(p => p.volume ?? 0), 1);
    const range = maxPrice - minPrice || 1;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Price + Volume</h3>
            <div className="relative h-28">
                <svg viewBox={`0 0 ${points.length} 100`} preserveAspectRatio="none" className="h-full w-full">
                    <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="0.8"
                        vectorEffect="non-scaling-stroke"
                        points={points.map((p, i) => `${i},${100 - ((p.close - minPrice) / range) * 100}`).join(" ")}
                    />
                </svg>
            </div>
            {hasVolume ? (
                <div className="mt-1 flex h-8 items-end gap-px">
                    {points.map((p, i) => (
                        <div key={i} className="flex-1 bg-zinc-600" style={{ height: `${((p.volume ?? 0) / maxVol) * 100}%` }} />
                    ))}
                </div>
            ) : (
                <p className="mt-1 text-[10px] text-zinc-700">Volume data not available from this source for this range.</p>
            )}
        </div>
    );
}