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
            <div className="space-y-2">
                {TIERS.map(tier => {
                    const tierAnalysts = voting.filter(r => r.recommendation === tier);
                    const count = tierAnalysts.length;
                    const pct = (count / total) * 100;
                    return (
                        <div key={tier} className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-20 text-zinc-500">{tier.replace("_", " ")}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-800">
                                    <div className={`h-full ${COLORS[tier]}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-6 text-right text-zinc-600">{count}</span>
                            </div>
                            {/* Real, already-computed content -- which specific analysts
                                landed in this tier -- fills the previously bare row instead
                                of leaving a thin bar with empty space beside it. */}
                            {count > 0 && (
                                <p className="pl-[88px] text-[9px] leading-snug text-zinc-600">
                                    {tierAnalysts.map(r => r.analyst).join(", ")}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}