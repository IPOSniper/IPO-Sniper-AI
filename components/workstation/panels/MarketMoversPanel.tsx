import Link from "next/link";
import { getGainersAndLosers, fetchAssetInfoBatch, type PriceMover } from "@/engine/evidence/providers/AlpacaMoversProvider";

async function getFilteredMovers(): Promise<{ gainers: PriceMover[]; losers: PriceMover[]; filteredByAsset: boolean }> {
    const { gainers: rawGainers, losers: rawLosers } = await getGainersAndLosers(15);
    const allSymbols = [...rawGainers, ...rawLosers].map(m => m.symbol);

    try {
        const assetInfo = await fetchAssetInfoBatch(allSymbols);
        const gainers = rawGainers.filter(m => assetInfo.get(m.symbol)?.isLikelyCommonStock !== false).slice(0, 6);
        const losers = rawLosers.filter(m => assetInfo.get(m.symbol)?.isLikelyCommonStock !== false).slice(0, 6);
        return { gainers, losers, filteredByAsset: true };
    } catch {
        return { gainers: rawGainers.slice(0, 6), losers: rawLosers.slice(0, 6), filteredByAsset: false };
    }
}

function isLikelyWarrantOrUnit(symbol: string): boolean {
    return /\.(WS|W)$/i.test(symbol) || /W$/.test(symbol) && symbol.length > 3 || symbol.includes(".");
}

function formatPrice(n: number | null): string {
    if (n === null) return "--";
    return `$${n.toFixed(2)}`;
}

function previousClose(price: number | null, change: number | null): number | null {
    if (price === null || change === null) return null;
    return price - change;
}

export default async function MarketMoversPanel() {
    const { gainers, losers, filteredByAsset } = await getFilteredMovers();

    if (gainers.length === 0 && losers.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-2 text-sm font-semibold text-zinc-300">Market Movers</h2>
                <p className="text-xs text-zinc-500">Movers unavailable right now -- check back when the market is open.</p>
            </div>
        );
    }

    function renderRow(m: PriceMover, positive: boolean) {
        const prevClose = previousClose(m.price, m.change);
        const isWarrant = isLikelyWarrantOrUnit(m.symbol);

        const content = (
            <div className="rounded-md px-1.5 py-1 hover:bg-zinc-900">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">
                        {m.symbol}{isWarrant ? <span className="ml-1 text-[9px] text-zinc-600">(warrant/unit)</span> : null}
                    </span>
                    <span className={positive ? "text-emerald-400" : "text-red-400"}>
                        {m.percentChange !== null ? `${positive ? "+" : ""}${m.percentChange.toFixed(2)}%` : "--"}
                    </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{formatPrice(m.price)}</span>
                    <span>{m.change !== null ? `${positive ? "+" : ""}$${m.change.toFixed(2)}` : ""}</span>
                    <span>Prev: {formatPrice(prevClose)}</span>
                </div>
            </div>
        );

        if (isWarrant) {
            return <div key={m.symbol}>{content}</div>;
        }
        return (
            <Link key={m.symbol} href={`/research/${m.symbol}`} className="block">
                {content}
            </Link>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">Market Movers</h2>
                <span className="text-[10px] text-zinc-600">
                    {filteredByAsset ? "Common stock -- filtered via Alpaca asset name" : "Filtering unavailable this load"}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-emerald-500">Top Gainers</p>
                    <div className="space-y-1">
                        {gainers.map(m => renderRow(m, true))}
                        {gainers.length === 0 && <p className="text-xs text-zinc-600">None after filtering.</p>}
                    </div>
                </div>
                <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-red-500">Top Losers</p>
                    <div className="space-y-1">
                        {losers.map(m => renderRow(m, false))}
                        {losers.length === 0 && <p className="text-xs text-zinc-600">None after filtering.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
