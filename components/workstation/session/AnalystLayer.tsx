import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const RECOMMENDATION_DOT: Record<string, string> = {
    STRONG_BUY: "bg-emerald-400",
    BUY: "bg-emerald-400",
    HOLD: "bg-zinc-400",
    REDUCE: "bg-amber-400",
    SELL: "bg-red-400",
};

/**
 * Analyst Activity Feed: shows every analyst that ran, whether it
 * had enough verified data to form a real opinion (confidence: 0 ==
 * my insufficientDataReport guard fired — see
 * engine/committee/analysts/shared/insufficientData.ts), and its
 * score/confidence if it did.
 */
export default function AnalystLayer({
research,
}: WorkstationPanelProps){

const reports = research.committee.reports;

return(
<section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
    <h2 className="mb-3 text-lg font-semibold">Analyst Activity</h2>

    <div className="divide-y divide-zinc-800">
        {reports.map(r => {
            const ran = r.confidence > 0;

            return (
                <div key={r.analyst} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${ran ? RECOMMENDATION_DOT[r.recommendation] : "bg-zinc-700"}`} />
                        <span className="text-zinc-200">{r.analyst}</span>
                    </div>

                    {ran ? (
                        <span className="text-zinc-500">
                            {r.recommendation.replace("_", " ")} · {r.confidence}%
                        </span>
                    ) : (
                        <span className="text-xs uppercase tracking-wide text-zinc-600">
                            No verified data
                        </span>
                    )}
                </div>
            );
        })}
    </div>
</section>
);
}
