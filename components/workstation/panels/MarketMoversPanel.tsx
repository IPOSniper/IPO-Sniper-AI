import Link from "next/link";
import { getGainersAndLosers } from "@/engine/evidence/providers/AlpacaMoversProvider";

export default async function MarketMoversPanel() {
    const { gainers, losers } = await getGainersAndLosers(6);

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
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">Market Movers</h2>
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
                    </div>
                </div>
            </div>
        </div>
    );
}
