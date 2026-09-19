"use client";

import { useEffect, useState } from "react";

interface ChainRow {
    strike: number;
    call?: { bid: number };
    put?: { bid: number };
}

export default function OptionsStrikeLadder({ ticker }: { ticker: string }) {
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
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Options Strike Ladder</h3>
                <p className="text-xs text-zinc-600">No options data available for this ticker.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Options Strike Ladder</h3>
            <div className="space-y-1">
                {rows.slice(0, 8).map(r => (
                    <div key={r.strike} className="flex items-center justify-between text-[10px]">
                        <span className="text-emerald-400">{r.call ? `$${r.call.bid.toFixed(2)}` : "-"}</span>
                        <span className="text-zinc-500">${r.strike}</span>
                        <span className="text-red-400">{r.put ? `$${r.put.bid.toFixed(2)}` : "-"}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
