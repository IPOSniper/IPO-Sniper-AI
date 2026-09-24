"use client";

import { useState } from "react";
import type { OptionContract } from "@/engine/trading/providers/AlpacaOptionsProvider";

export default function OptionsExplainer({
    ticker,
    spotPrice,
    call,
    put,
}: {
    ticker: string;
    spotPrice: number;
    call: OptionContract;
    put: OptionContract;
}) {
    const [open, setOpen] = useState(false);

    const lines: string[] = [];

    if (call.delta !== null) {
        const pct = Math.round(Math.abs(call.delta) * 100);
        lines.push(`This call's Delta of ${call.delta.toFixed(3)} is a rough proxy for roughly a ${pct}% chance it finishes in-the-money -- it also means the option's price should move about $${Math.abs(call.delta).toFixed(2)} for every $1 move in ${ticker}.`);
    }
    if (call.theta !== null) {
        lines.push(`This call's Theta of ${call.theta.toFixed(3)} means real expected time decay -- losing roughly $${Math.abs(call.theta).toFixed(2)} of value per day if ${ticker}'s price and volatility don't change.`);
    }
    if (put.delta !== null) {
        const pct = Math.round(Math.abs(put.delta) * 100);
        lines.push(`This put's Delta of ${put.delta.toFixed(3)} similarly proxies roughly a ${pct}% chance it finishes in-the-money.`);
    }
    if (call.impliedVolatility !== null && put.impliedVolatility !== null) {
        const diff = Math.abs(call.impliedVolatility - put.impliedVolatility) * 100;
        if (diff >= 3) {
            lines.push(`The call's IV (${(call.impliedVolatility * 100).toFixed(1)}%) and put's IV (${(put.impliedVolatility * 100).toFixed(1)}%) differ by ${diff.toFixed(1)} points -- real market makers are pricing slightly different volatility expectations into each side, not a data error.`);
        }
    }

    return (
        <div className="mt-3 border-t border-zinc-800 pt-2">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex w-full items-center justify-between text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-300"
            >
                <span>What am I looking at?</span>
                <span>{open ? "\u2212" : "+"}</span>
            </button>

            {open && (
                <div className="mt-2 space-y-3 text-[11px] leading-relaxed text-zinc-400">
                    <div>
                        <p className="mb-1 font-semibold text-zinc-300">In plain terms</p>
                        <p><span className="text-zinc-300">Strike price</span> is the price you'd buy (call) or sell (put) the stock at if you exercised. <span className="text-zinc-300">Bid/Ask</span> is what buyers/sellers are currently offering for the contract itself. <span className="text-zinc-300">IV (implied volatility)</span> is the market's real-time guess at how much the stock will swing before expiration. <span className="text-zinc-300">Delta</span> measures how much the option's price moves per $1 move in the stock. <span className="text-zinc-300">Theta</span> measures how much value the option loses each day just from time passing.</p>
                    </div>
                    {lines.length > 0 && (
                        <div>
                            <p className="mb-1 font-semibold text-zinc-300">For {ticker} specifically, right now</p>
                            <ul className="list-disc space-y-1 pl-4">
                                {lines.map((line, i) => <li key={i}>{line}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}