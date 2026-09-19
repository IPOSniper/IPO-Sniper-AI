"use client";

import { useEffect, useState } from "react";

interface ChainRow {
    strike: number;
    call?: { openInterest: number };
    put?: { openInterest: number };
}

export default function OpenInterestByStrike({ ticker }: { ticker: string }) {
    const [rows, setRows] = useState<ChainRow[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/quote/${ticker}/chain`)
            .then(res => res.json())
            .then(data => { if (!cancelled) setRows(data.chain ?? []); })
            .catch(() => { if (!cancelled) setRows([]); });
        return () => { cancelled = true; };
    }, [ticker]);

    if (!rows || rows.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Open Interest by Strike</h3>
                <p className="text-xs text-zinc-600">No options data available for this ticker.</p>
            </div>
        );
    }

    const totals = rows.map(r => (r.call?.openInterest ?? 0) + (r.put?.openInterest ?? 0));
    const max = Math.max(...totals, 1);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Open Interest by Strike</h3>
            <div className="space-y-1">
                {rows.slice(0, 8).map((r, i) => (
                    <div key={r.strike} className="flex items-center gap-2 text-[10px]">
                        <span className="w-10 text-zinc-500">${r.strike}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-800">
                            <div className="h-full bg-violet-500" style={{ width: `${(totals[i] / max) * 100}%` }} />
                        </div>
                        <span className="w-10 text-right text-zinc-600">{totals[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
