import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { getRecommendationLabel } from "@/engine/committee/shared/recommendationLabels";

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "text-emerald-400",
    BUY: "text-emerald-400",
    HOLD: "text-zinc-300",
    REDUCE: "text-red-400",
    SELL: "text-red-400",
};

export default function ResearchSnapshotPanel({ research }: WorkstationPanelProps) {
    const { researchSnapshot, runtime } = research;
    const color = RECOMMENDATION_COLOR[researchSnapshot.recommendation] ?? "text-zinc-300";

    const generatedLabel = new Date(runtime.generatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-400">Research Snapshot</h2>
                <span className="text-xs text-zinc-600">
                    Generated {generatedLabel} - {researchSnapshot.analystCount} analysts, {researchSnapshot.votingAnalystCount} voting
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                    <p className="text-xs text-zinc-500">Verdict</p>
                    <p className={`mt-1 text-xl font-bold ${color}`}>
                        {getRecommendationLabel(researchSnapshot.recommendation)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-zinc-500">Conviction</p>
                    <p className="mt-1 text-xl font-bold text-white">{researchSnapshot.conviction}/100</p>
                </div>
                <div>
                    <p className="text-xs text-zinc-500">Confidence</p>
                    <p className="mt-1 text-xl font-bold text-white">{researchSnapshot.confidence}%</p>
                </div>
                <div>
                    <p className="text-xs text-zinc-500">Agreement</p>
                    <p className="mt-1 text-xl font-bold text-white">{researchSnapshot.agreement}%</p>
                </div>
            </div>

            <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-600">
                This snapshot reflects the committee analysis and evidence available at the time shown above -- reload to run fresh research.
            </p>
        </div>
    );
}