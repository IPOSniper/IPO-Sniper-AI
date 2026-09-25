import { FinnhubQuoteProvider } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import type { EvidenceItem } from "@/engine/evidence/types";
import UnverifiedCard from "../../shared/UnverifiedCard";

/**
 * Ticker-independent for the index quotes themselves, but now
 * optionally accepts the researched company's own real historical
 * volatility (already computed in marketBackfill.ts, confidence 70)
 * as a fallback for the Volatility slot -- REAL VIX FIX: previously
 * always showed "VIX unavailable" because Finnhub's /quote endpoint
 * doesn't support the ^VIX symbol format at all, even though a real,
 * relevant volatility number was already computed elsewhere and
 * simply never wired here.
 *
 * Honesty requirement: the fallback is a DIFFERENT real metric
 * (this company's own real historical volatility, not broad-market
 * implied volatility) and is labeled as such -- never disguised as
 * "VIX", which would misrepresent what's actually being shown.
 *
 * "Regime" and "Breadth" remain intentionally placeholder labels --
 * no regime-detection or market-breadth logic exists in this
 * codebase yet. Never fabricate these without real logic behind them.
 */
const INDICES = [
    { symbol: "SPY", label: "SPY" },
    { symbol: "QQQ", label: "QQQ" },
    { symbol: "IWM", label: "IWM" },
];
const VOLATILITY_SYMBOL = { symbol: "^VIX", label: "VIX" };

export default async function MarketContext({
    ticker,
    fallbackVolatility,
}: {
    ticker?: string;
    fallbackVolatility?: EvidenceItem<number>;
} = {}) {
    const provider = new FinnhubQuoteProvider();
    const results = await Promise.allSettled(
        [...INDICES, VOLATILITY_SYMBOL].map(index => provider.getQuote(index.symbol))
    );

    const allFailed = results.every(r => r.status === "rejected");
    if (allFailed) {
        const firstRejected = results.find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
        const realReason = firstRejected?.reason instanceof Error
            ? firstRejected.reason.message
            : "No FINNHUB_API_KEY configured, or index quotes unavailable";
        return <UnverifiedCard title="Market Context" reason={realReason} />;
    }

    const indexResults = results.slice(0, INDICES.length);
    const volResult = results[INDICES.length];
    const hasFallbackVol = volResult.status === "rejected" && fallbackVolatility?.verified;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Market Context</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-600">Regime</p>
                    <p className="text-zinc-700">Not yet computed</p>
                </div>
                <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-600">Indexes</p>
                    <div className="space-y-1">
                        {INDICES.map((index, i) => {
                            const result = indexResults[i];
                            if (result.status === "rejected") {
                                const reason = result.reason instanceof Error ? result.reason.message : "unavailable";
                                return (
                                    <div key={index.symbol} className="flex items-center justify-between">
                                        <span className="text-zinc-500">{index.label}</span>
                                        <span className="text-xs text-zinc-700" title={reason}>unavailable</span>
                                    </div>
                                );
                            }
                            const isUp = result.value.changePercent >= 0;
                            return (
                                <div key={index.symbol} className="flex items-center justify-between">
                                    <span className="text-zinc-300">{index.label}</span>
                                    <span className={isUp ? "text-emerald-400" : "text-red-400"}>
                                        {isUp ? "+" : ""}{result.value.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-600">Volatility</p>
                    {volResult.status !== "rejected" ? (
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300">{VOLATILITY_SYMBOL.label}</span>
                            <span className="text-zinc-500">{volResult.value.price.toFixed(2)}</span>
                        </div>
                    ) : hasFallbackVol ? (
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-300">30D HV{ticker ? ` (${ticker})` : ""}</span>
                                <span className="text-zinc-500">{fallbackVolatility!.value.toFixed(1)}%</span>
                            </div>
                            <p className="mt-0.5 text-[9px] text-zinc-700">Real historical volatility, not VIX</p>
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-700">VIX unavailable</p>
                    )}
                </div>
                <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-600">Breadth</p>
                    <p className="text-zinc-700">Not yet computed</p>
                </div>
            </div>
        </div>
    );
}