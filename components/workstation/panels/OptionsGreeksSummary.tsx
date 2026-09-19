"use client";

import { useEffect, useState } from "react";

interface ChainRow {
    strike: number;
    call?: { impliedVolatility: number; delta: number; theta: number };
    put?: { impliedVolatility: number; delta: number; theta: number };
}

export default function OptionsGreeksSummary({ ticker }: { ticker: string }) {
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
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Options Greeks</h3>
                <p className="text-xs text-zinc-600">No options data available for this ticker.</p>
            </div>
        );
    }

    const atm = rows[Math.floor(rows.length / 2)];

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Options Greeks (ATM Strike ${atm.strike})</h3>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                    <div className="text-emerald-400">Call</div>
                    <div className="text-zinc-500">IV: {atm.call ? (atm.call.impliedVolatility * 100).toFixed(1) + "%" : "-"}</div>
                    <div className="text-zinc-500">Delta: {atm.call?.delta.toFixed(2) ?? "-"}</div>
                    <div className="text-zinc-500">Theta: {atm.call?.theta.toFixed(2) ?? "-"}</div>
                </div>
                <div>
                    <div className="text-red-400">Put</div>
                    <div className="text-zinc-500">IV: {atm.put ? (atm.put.impliedVolatility * 100).toFixed(1) + "%" : "-"}</div>
                    <div className="text-zinc-500">Delta: {atm.put?.delta.toFixed(2) ?? "-"}</div>
                    <div className="text-zinc-500">Theta: {atm.put?.theta.toFixed(2) ?? "-"}</div>
                </div>
            </div>
        </div>
    );
}
