import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function CommitteeConsensusCard({ research }: WorkstationPanelProps) {
    const voting = research.committee.reports.filter(r => r.confidence > 0);
    const total = voting.length || 1;
    const bullish = voting.filter(r => r.recommendation === "BUY" || r.recommendation === "STRONG_BUY").length;
    const hold = voting.filter(r => r.recommendation === "HOLD").length;
    const bearish = voting.filter(r => r.recommendation === "SELL" || r.recommendation === "REDUCE").length;

    const pct = (n: number) => Math.round((n / total) * 100);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Committee Consensus</h3>
            <div className="flex h-3 w-full overflow-hidden rounded-full">
                <div className="bg-emerald-500" style={{ width: `${pct(bullish)}%` }} />
                <div className="bg-zinc-600" style={{ width: `${pct(hold)}%` }} />
                <div className="bg-red-500" style={{ width: `${pct(bearish)}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Bullish {pct(bullish)}% ({bullish})
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                    <span className="h-2 w-2 rounded-sm bg-zinc-600" /> Neutral {pct(hold)}% ({hold})
                </span>
                <span className="flex items-center gap-1.5 text-red-400">
                    <span className="h-2 w-2 rounded-sm bg-red-500" /> Bearish {pct(bearish)}% ({bearish})
                </span>
            </div>
            <div className="mt-3 border-t border-zinc-800 pt-2 text-center text-[10px] text-zinc-500">
                {voting.length}/{research.committee.reports.length} analysts &middot; {Math.round(voting.reduce((s, r) => s + r.confidence, 0) / (voting.length || 1))}% avg. confidence
            </div>
        </div>
    );
}
