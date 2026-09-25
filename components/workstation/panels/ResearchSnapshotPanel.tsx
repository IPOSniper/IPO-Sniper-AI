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
    const { committee } = research;
    const { financial, quote: q } = research.report.evidence;

    const canRunway = financial.freeCashFlow.verified && financial.freeCashFlow.value < 0
        && financial.cashAndEquivalents.verified && financial.cashAndEquivalents.value > 0;
    const monthlyBurn = canRunway ? Math.abs(financial.freeCashFlow.value) / 12 : null;
    const runwayMonths = canRunway && monthlyBurn && monthlyBurn > 0
        ? financial.cashAndEquivalents.value / monthlyBurn : null;
    const canLeverage = financial.totalDebt.verified && financial.totalDebt.value > 0
        && q.marketCap.verified && q.marketCap.value > 0;
    const debtToMarketCap = canLeverage ? financial.totalDebt.value / q.marketCap.value : null;
    const hasSurvival = runwayMonths !== null || debtToMarketCap !== null;
    const valuationAnalyst = committee.reports.find(r => r.analyst === "Valuation Analyst" && r.confidence > 0);
    const verificationAnalyst = committee.reports.find(r => r.analyst === "Verification Analyst" && r.confidence > 0);
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

            {(hasSurvival || valuationAnalyst || verificationAnalyst) && (
                <div className="mt-4 space-y-3 border-t border-zinc-800 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Client Takeaways - factual, not sentiment</p>
                    {hasSurvival && (
                        <div>
                            <p className="text-xs font-medium text-zinc-400">Can it survive / keep performing?</p>
                            {runwayMonths !== null && <p className="mt-0.5 text-xs text-amber-400">Approximately {runwayMonths.toFixed(1)} months of cash runway at the current real burn rate.</p>}
                            {debtToMarketCap !== null && <p className="mt-0.5 text-xs text-zinc-300">Real total debt is {(debtToMarketCap * 100).toFixed(0)}% of current market cap.</p>}
                        </div>
                    )}
                    {valuationAnalyst && (
                        <div>
                            <p className="text-xs font-medium text-zinc-400">Is it a good value at this price?</p>
                            <p className="mt-0.5 text-xs text-zinc-300">{valuationAnalyst.thesis}</p>
                        </div>
                    )}
                    {verificationAnalyst && (
                        <div>
                            <p className="text-xs font-medium text-zinc-400">Can I trust what I&apos;m being told?</p>
                            <p className="mt-0.5 text-xs text-zinc-300">{verificationAnalyst.thesis}</p>
                        </div>
                    )}
                </div>
            )}

            <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-600">
                This snapshot reflects the committee analysis and evidence available at the time shown above -- reload to run fresh research.
            </p>
        </div>
    );
}