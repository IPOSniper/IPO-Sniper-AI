import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { recommendationToRating, strengthLabel, averageEvidenceStrength } from "../shared/scorePresentation";
import type { EvidenceItem } from "@/engine/evidence/types";

const RATING_STYLE: Record<string, string> = {
    Bullish: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Neutral: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    Bearish: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function RecommendationPanel({ research }: WorkstationPanelProps) {
    const { committee } = research;
    const rating = recommendationToRating(committee.recommendation);
    const style = RATING_STYLE[rating];

    const evidenceStrengthPct = averageEvidenceStrength(committee.reports);

    // Same "Data Completeness" number as the Evidence Status panel —
    // computed the same way (verified fields / total fields across
    // all evidence categories) so the two never disagree.
    const evidence = research.report.evidence;
    const categories = ["financial", "management", "ipo", "market", "industry", "news", "sec", "quote", "financialStatements"] as const;
    const allItems = categories.flatMap(c => Object.values(evidence[c]) as EvidenceItem<unknown>[]);
    const dataCompleteness = allItems.length > 0
        ? Math.round((allItems.filter(i => i.verified).length / allItems.length) * 100)
        : 0;

    const lastUpdated = new Date(research.runtime.generatedAt);
    const isToday = lastUpdated.toDateString() === new Date().toDateString();
    const lastUpdatedLabel = isToday
        ? `Today, ${lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
        : lastUpdated.toLocaleDateString();

    return (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">Current AI Assessment</h2>

            <div className="flex items-center gap-4">
                <span className={`rounded-lg border px-4 py-2 text-lg font-bold ${style}`}>
                    {rating}
                </span>

                <div className="grid flex-1 grid-cols-3 gap-3 text-sm">
                    <div>
                        <p className="text-zinc-500">Evidence Strength</p>
                        <p className="font-semibold text-white">{strengthLabel(evidenceStrengthPct)}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500">Data Completeness</p>
                        <p className="font-semibold text-white">{dataCompleteness}%</p>
                    </div>
                    <div>
                        <p className="text-zinc-500">Last Updated</p>
                        <p className="font-semibold text-white">{lastUpdatedLabel}</p>
                    </div>
                </div>
            </div>

            <p className="mt-3 text-xs text-zinc-600">
                Underlying score {committee.overallScore}/100 · confidence {committee.confidence}% ·
                {" "}{committee.agreement}% analyst agreement — see Committee Discussion below for the full breakdown.
            </p>
        </section>
    );
}
