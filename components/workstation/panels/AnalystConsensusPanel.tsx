import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * Real sell-side analyst recommendation counts + consensus price
 * target -- the single most-requested standard research data point
 * this app was missing entirely (confirmed absent from the evidence
 * model, not just thin for one ticker). Honest zero-confidence
 * abstention when Finnhub has no real coverage for a ticker, same
 * convention as every other panel here.
 */
export default function AnalystConsensusPanel({ research }: WorkstationPanelProps) {
    const ac = research.report.evidence.analystConsensus;
    const total = ac.strongBuy.value + ac.buy.value + ac.hold.value + ac.sell.value + ac.strongSell.value;

    if (!ac.strongBuy.verified && total === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Analyst Consensus</h3>
                <p className="text-xs text-zinc-600">No real sell-side analyst coverage found for this ticker.</p>
            </div>
        );
    }

    const tiers: { label: string; count: number; color: string }[] = [
        { label: "Strong Buy", count: ac.strongBuy.value, color: "bg-emerald-600" },
        { label: "Buy", count: ac.buy.value, color: "bg-emerald-400" },
        { label: "Hold", count: ac.hold.value, color: "bg-zinc-500" },
        { label: "Sell", count: ac.sell.value, color: "bg-red-400" },
        { label: "Strong Sell", count: ac.strongSell.value, color: "bg-red-600" },
    ];

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Analyst Consensus</h3>
            <div className="space-y-1.5">
                {tiers.map(t => (
                    <div key={t.label} className="flex items-center gap-2 text-[10px]">
                        <span className="w-20 text-zinc-500">{t.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-800">
                            <div className={`h-full ${t.color}`} style={{ width: `${total > 0 ? (t.count / total) * 100 : 0}%` }} />
                        </div>
                        <span className="w-6 text-right text-zinc-600">{t.count}</span>
                    </div>
                ))}
            </div>
            {ac.priceTargetMean.verified && (
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-900 pt-2 text-center">
                    <div>
                        <p className="text-[9px] uppercase text-zinc-600">Low</p>
                        <p className="text-xs font-semibold text-zinc-300">${ac.priceTargetLow.value.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase text-zinc-600">Mean Target</p>
                        <p className="text-sm font-semibold text-white">${ac.priceTargetMean.value.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase text-zinc-600">High</p>
                        <p className="text-xs font-semibold text-zinc-300">${ac.priceTargetHigh.value.toFixed(2)}</p>
                    </div>
                </div>
            )}
            <p className="mt-2 text-[9px] text-zinc-700">Real Finnhub sell-side data - {total} analyst{total === 1 ? "" : "s"} covering this ticker.</p>
        </div>
    );
}