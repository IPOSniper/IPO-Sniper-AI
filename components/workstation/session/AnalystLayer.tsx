import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import AnalystConsensusChart from "../panels/AnalystConsensusChart";

const RECOMMENDATION_DOT: Record<string, string> = {
    STRONG_BUY: "bg-emerald-400",
    BUY: "bg-emerald-400",
    HOLD: "bg-zinc-400",
    REDUCE: "bg-amber-400",
    SELL: "bg-red-400",
};

/**
 * Analyst Activity Feed. Analysts with a real opinion (confidence > 0) are
 * listed in two columns; analysts that had no verified data are collapsed
 * into one line of chips instead of one full-width row each. Same data,
 * roughly a third of the height.
 */
export default function AnalystLayer({ research }: WorkstationPanelProps) {
    const reports = research.committee.reports;
    const voting = reports.filter(r => r.confidence > 0);
    const excluded = reports.filter(r => r.confidence <= 0);

    return (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-lg font-semibold">Analyst Activity</h2>
            <div className="mb-4">
                <AnalystConsensusChart reports={reports} />
            </div>

            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                {voting.map(r => (
                    <div key={r.analyst} className="flex items-center justify-between border-b border-zinc-800/70 py-1.5 text-sm">
                        <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${RECOMMENDATION_DOT[r.recommendation] ?? "bg-zinc-500"}`} />
                            <span className="text-zinc-200">{r.analyst}</span>
                        </div>
                        <span className="text-zinc-500">
                            {r.recommendation.replace("_", " ")} - {r.confidence}%
                        </span>
                    </div>
                ))}
            </div>

            {excluded.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-800 pt-3">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-600">
                        No verified data ({excluded.length}):
                    </span>
                    {excluded.map(r => (
                        <span key={r.analyst} className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">
                            {r.analyst}
                        </span>
                    ))}
                </div>
            )}
        </section>
    );
}
