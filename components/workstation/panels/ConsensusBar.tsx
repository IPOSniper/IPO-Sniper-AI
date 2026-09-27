import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function ConsensusBar({ research }: WorkstationPanelProps) {
    const voting = research.committee.reports.filter(r => r.confidence > 0);
    const total = voting.length || 1;
    const bullish = voting.filter(r => r.recommendation === "BUY" || r.recommendation === "STRONG_BUY").length;
    const hold = voting.filter(r => r.recommendation === "HOLD").length;
    const bearish = voting.filter(r => r.recommendation === "SELL" || r.recommendation === "REDUCE").length;

    return (
        <div className="mt-4 border-t border-zinc-800 pt-3">
            <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Vote Distribution</span>
                <span className="text-zinc-500">{bullish} Bullish - {hold} Neutral - {bearish} Bearish</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="bg-emerald-500" style={{ width: (bullish / total * 100) + "%" }} />
                <div className="bg-zinc-500" style={{ width: (hold / total * 100) + "%" }} />
                <div className="bg-red-500" style={{ width: (bearish / total * 100) + "%" }} />
            </div>
        </div>
    );
}
