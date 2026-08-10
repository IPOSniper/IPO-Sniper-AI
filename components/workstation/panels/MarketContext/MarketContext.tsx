import { FinnhubQuoteProvider } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import UnverifiedCard from "../../shared/UnverifiedCard";

/**
 * Ticker-independent, so unlike every other panel here it doesn't
 * take `research` as a prop — it fetches its own real index quotes.
 * Async Server Component: Next.js renders this by awaiting it
 * directly, no client-side fetch needed.
 *
 * VIX is quoted on Finnhub as ^VIX in some plans and not available
 * on others depending on subscription tier — if it fails, it fails
 * independently of SPY/QQQ (Promise.allSettled), not all-or-nothing.
 */

const INDICES = [
    { symbol: "SPY", label: "SPY" },
    { symbol: "QQQ", label: "QQQ" },
    { symbol: "^VIX", label: "VIX" },
];

export default async function MarketContext() {
    const provider = new FinnhubQuoteProvider();

    const results = await Promise.allSettled(
        INDICES.map(index => provider.getQuote(index.symbol))
    );

    const allFailed = results.every(r => r.status === "rejected");

    if (allFailed) {
        return <UnverifiedCard title="Market Context" reason="No FINNHUB_API_KEY configured, or index quotes unavailable" />;
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="mb-3 text-lg font-semibold">Market Context</h2>

            <div className="space-y-2">
                {INDICES.map((index, i) => {
                    const result = results[i];

                    if (result.status === "rejected") {
                        return (
                            <div key={index.symbol} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">{index.label}</span>
                                <span className="text-xs text-zinc-700">unavailable</span>
                            </div>
                        );
                    }

                    const isUp = result.value.changePercent >= 0;

                    return (
                        <div key={index.symbol} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300">{index.label}</span>
                            <span className="text-zinc-500">{result.value.price.toFixed(2)}</span>
                            <span className={isUp ? "text-emerald-400" : "text-red-400"}>
                                {isUp ? "+" : ""}{result.value.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
