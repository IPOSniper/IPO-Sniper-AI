import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const VOTE_COLOR: Record<string, string> = {
    STRONG_BUY: "text-emerald-400",
    BUY: "text-emerald-400",
    HOLD: "text-zinc-400",
    REDUCE: "text-red-400",
    SELL: "text-red-400",
};

const VOTE_DOT: Record<string, string> = {
    STRONG_BUY: "bg-emerald-400",
    BUY: "bg-emerald-400",
    HOLD: "bg-zinc-500",
    REDUCE: "bg-red-400",
    SELL: "bg-red-400",
};

export default function CommitteeModule({ research }: WorkstationPanelProps) {
    const { committee } = research;
    const voting = committee.reports.filter(r => r.confidence > 0);
    const noData = committee.reports.filter(r => r.confidence === 0);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-1 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    AI Investment Committee
                </h3>
                <span className="text-[10px] text-emerald-400">{committee.reports.length} Analysts</span>
            </div>
            <p className="mb-3 text-[11px] text-zinc-600">
                {voting.length} with verified opinions - {noData.length} insufficient data
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                {committee.reports.map(r => (
                    <div key={r.analyst} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 text-xs">
                            <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (r.confidence > 0 ? (VOTE_DOT[r.recommendation] ?? "bg-zinc-500") : "bg-zinc-700")} />
                            <span className="truncate text-zinc-400">{r.analyst}</span>
                            <span className={"ml-auto text-[11px] font-medium " + (r.confidence > 0 ? (VOTE_COLOR[r.recommendation] ?? "text-zinc-400") : "text-zinc-600")}>
                                {r.confidence > 0 ? r.recommendation.replace("_", " ") : "NO DATA"}
                            </span>
                        </div>
                        {r.confidence > 0 && (
                            <div className="h-0.5 w-full overflow-hidden rounded-full bg-zinc-800">
                                <div className={(VOTE_DOT[r.recommendation] ?? "bg-zinc-500")} style={{ width: r.confidence + "%", height: "100%" }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-4 border-t border-zinc-800 pt-3">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">Committee Consensus</span>
                    <span className={"text-sm font-bold " + (VOTE_COLOR[committee.recommendation] ?? "text-zinc-300")}>
                        {committee.recommendation.replace("_", " ")} - {committee.agreement}% agreement
                    </span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="bg-emerald-500" style={{ width: (voting.filter(r => r.recommendation === "BUY" || r.recommendation === "STRONG_BUY").length / (voting.length || 1) * 100) + "%" }} />
                    <div className="bg-zinc-500" style={{ width: (voting.filter(r => r.recommendation === "HOLD").length / (voting.length || 1) * 100) + "%" }} />
                    <div className="bg-red-500" style={{ width: (voting.filter(r => r.recommendation === "SELL" || r.recommendation === "REDUCE").length / (voting.length || 1) * 100) + "%" }} />
                </div>
            </div>
            {voting.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-zinc-800 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">Highlights</p>
                    {voting.slice(0, 4).map(r => (
                        <p key={r.analyst} className="text-[11px] text-zinc-500">
                            {r.thesis}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
