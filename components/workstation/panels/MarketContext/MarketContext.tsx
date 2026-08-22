import { FinnhubQuoteProvider } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import UnverifiedCard from "../../shared/UnverifiedCard";

/**
 * Ticker-independent, so unlike every other panel here it doesn't
 * take `research` as a prop -- it fetches its own real index quotes.
 * Async Server Component: Next.js renders this by awaiting it
 * directly, no client-side fetch needed.
 *
 * VIX is quoted on Finnhub as ^VIX in some plans and not available
 * on others depending on subscription tier -- if it fails, it fails
 * independently of SPY/QQQ (Promise.allSettled), not all-or-nothing.
 *
 * "Regime" is intentionally left as a placeholder label, not a
 * computed value -- there is no regime-detection logic in this
 * codebase yet. Never fabricate a Risk-On/Risk-Off label without
 * real logic behind it.
 */
const INDICES = [
    { symbol: "SPY", label: "SPY" },
    { symbol: "QQQ", label: "QQQ" },
];
const VOLATILITY_SYMBOL = { symbol: "^VIX", label: "VIX" };

export default async function MarketContext() {
    const provider = new FinnhubQuoteProvider();
    const results = await Promise.allSettled(
        [...INDICES, VOLATILITY_SYMBOL].map(index => provider.getQuote(index.symbol))
    );

    const allFailed = results.every(r => r.status === "rejected");
    if (allFailed) {
        return <UnverifiedCard title="Market Context" reason="No FINNHUB_API_KEY configured, or index quotes unavailable" />;
    }

    const indexResults = results.slice(0, INDICES.length);
    const volResult = results[INDICES.length];

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Market Context</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
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
                                return (
                                    <div key={index.symbol} className="flex items-center justify-between">
                                        <span className="text-zinc-500">{index.label}</span>
                                        <span className="text-xs text-zinc-700">unavailable</span>
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
                    {volResult.status === "rejected" ? (
                        <p className="text-xs text-zinc-700">VIX unavailable</p>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300">{VOLATILITY_SYMBOL.label}</span>
                            <span className="text-zinc-500">{volResult.value.price.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}