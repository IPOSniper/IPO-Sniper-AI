import Link from "next/link";
import { getGainersAndLosers, type PriceMover } from "@/engine/evidence/providers/AlpacaMoversProvider";

function isLikelyWarrantOrUnit(symbol: string): boolean {
    return /\.(WS|W)$/i.test(symbol) || /W$/.test(symbol) && symbol.length > 3 || symbol.includes(".");
}

function filterCommonStock(movers: PriceMover[]): PriceMover[] {
    return movers.filter(m => !isLikelyWarrantOrUnit(m.symbol));
}

export default async function MarketMoversPanel() {
    const { gainers: rawGainers, losers: rawLosers } = await getGainersAndLosers(20);
    const gainers = filterCommonStock(rawGainers).slice(0, 6);
    const losers = filterCommonStock(rawLosers).slice(0, 6);

    if (gainers.length === 0 && losers.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-2 text-sm font-semibold text-zinc-300">Market Movers</h2>
                <p className="text-xs text-zinc-500">Movers unavailable right now — check back when the market is open.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">Market Movers</h2>
                <span className="text-[10px] text-zinc-600">Common stock — warrants/units filtered by symbol pattern, not verified security type</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-emerald-500">Top Gainers</p>
                    <div className="space-y-1">
                        {gainers.map(m => (
                            <Link key={m.symbol} href={`/research/${m.symbol}`} className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs hover:bg-zinc-900">
                                <span className="font-medium text-white">{m.symbol}</span>
                                <span className="text-emerald-400">{m.percentChange !== null ? `+${m.percentChange.toFixed(2)}%` : "—"}</span>
                            </Link>
                        ))}
                        {gainers.length === 0 && <p className="text-xs text-zinc-600">None after filtering.</p>}
                    </div>
                </div>
                <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-red-500">Top Losers</p>
                    <div className="space-y-1">
                        {losers.map(m => (
                            <Link key={m.symbol} href={`/research/${m.symbol}`} className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs hover:bg-zinc-900">
                                <span className="font-medium text-white">{m.symbol}</span>
                                <span className="text-red-400">{m.percentChange !== null ? `${m.percentChange.toFixed(2)}%` : "—"}</span>
                            </Link>
                        ))}
                        {losers.length === 0 && <p className="text-xs text-zinc-600">None after filtering.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
