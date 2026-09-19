import { SECForm4Provider } from "@/engine/evidence/providers/SECForm4Provider";

export default async function InsiderBuySellBalance({ ticker }: { ticker: string }) {
    const transactions = await new SECForm4Provider().getRecentInsiderTransactions(ticker, 8);

    if (!transactions || transactions.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Insider Buy/Sell Balance</h3>
                <p className="text-xs text-zinc-600">No recent Form 4 filings found.</p>
            </div>
        );
    }

    const buyShares = transactions.filter(t => t.acquiredOrDisposed === "A").reduce((sum, t) => sum + (t.shares ?? 0), 0);
    const sellShares = transactions.filter(t => t.acquiredOrDisposed === "D").reduce((sum, t) => sum + (t.shares ?? 0), 0);
    const max = Math.max(buyShares, sellShares, 1);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Insider Buy/Sell Balance</h3>
            <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                    <span className="w-10 text-emerald-400">Buy</span>
                    <div className="h-3 flex-1 overflow-hidden rounded bg-zinc-800">
                        <div className="h-full bg-emerald-500" style={{ width: `${(buyShares / max) * 100}%` }} />
                    </div>
                    <span className="w-20 text-right text-zinc-500">{buyShares.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-10 text-red-400">Sell</span>
                    <div className="h-3 flex-1 overflow-hidden rounded bg-zinc-800">
                        <div className="h-full bg-red-500" style={{ width: `${(sellShares / max) * 100}%` }} />
                    </div>
                    <span className="w-20 text-right text-zinc-500">{sellShares.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
