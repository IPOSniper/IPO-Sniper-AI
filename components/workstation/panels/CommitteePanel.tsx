import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const VOTE_ICON: Record<string, string> = {
    STRONG_BUY: "▲▲",
    BUY: "▲",
    HOLD: "—",
    REDUCE: "▼",
    SELL: "▼▼",
};

export default function CommitteePanel({ research }: WorkstationPanelProps) {
    const { committee } = research;

    const scoredReports = committee.reports.filter(r => r.confidence > 0);
    const excludedCount = committee.reports.length - scoredReports.length;

    const bullish = scoredReports.filter(
        r => r.recommendation === "BUY" || r.recommendation === "STRONG_BUY"
    ).length;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Committee Discussion</h2>
                <span className="text-xs text-zinc-500">
                    {bullish}/{scoredReports.length} bullish
                </span>
            </div>

            <div className="space-y-3">
                {scoredReports.map(r => (
                    <div key={r.analyst} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                        <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-white">{r.analyst}</span>
                            <span className="text-zinc-500">{VOTE_ICON[r.recommendation]} {r.recommendation.replace("_", " ")}</span>
                        </div>
                        <p className="text-sm italic text-zinc-400">&ldquo;{r.thesis}&rdquo;</p>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-950 p-3">
                <span className="text-sm font-medium text-white">Committee Vote</span>
                <span className="text-sm font-semibold text-white">
                    {committee.recommendation.replace("_", " ")} · {committee.agreement}% agreement
                </span>
            </div>

            {excludedCount > 0 && (
                <p className="mt-2 text-xs text-zinc-600">
                    {excludedCount} analyst(s) not shown — insufficient verified data to vote.
                </p>
            )}
        </div>
    );
}
