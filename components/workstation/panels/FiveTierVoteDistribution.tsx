import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const TIERS = ["STRONG_BUY", "BUY", "HOLD", "REDUCE", "SELL"] as const;
const COLORS: Record<string, string> = {
    STRONG_BUY: "bg-emerald-600",
    BUY: "bg-emerald-400",
    HOLD: "bg-zinc-500",
    REDUCE: "bg-red-400",
    SELL: "bg-red-600",
};

export default function FiveTierVoteDistribution({ research }: WorkstationPanelProps) {
    const voting = research.committee.reports.filter(r => r.confidence > 0);
    const total = voting.length || 1;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Vote Distribution (5-Tier)</h3>
            <div className="space-y-1.5">
                {TIERS.map(tier => {
                    const count = voting.filter(r => r.recommendation === tier).length;
                    const pct = (count / total) * 100;
                    return (
                        <div key={tier} className="flex items-center gap-2 text-[10px]">
                            <span className="w-20 text-zinc-500">{tier.replace("_", " ")}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-800">
                                <div className={`h-full ${COLORS[tier]}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right text-zinc-600">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
