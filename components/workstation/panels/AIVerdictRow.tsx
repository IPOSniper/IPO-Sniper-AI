import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { getRecommendationLabel } from "@/engine/committee/shared/recommendationLabels";

const RECOMMENDATION_LABEL: Record<string, string> = {
 STRONG_BUY: "STRONG BUY",
 BUY: "BUY",
 HOLD: "HOLD",
 REDUCE: "REDUCE",
 SELL: "SELL",
};

const RECOMMENDATION_COLOR: Record<string, string> = {
 STRONG_BUY: "text-emerald-400",
 BUY: "text-emerald-400",
 HOLD: "text-zinc-300",
 REDUCE: "text-red-400",
 SELL: "text-red-400",
};

/**
 * Three real cards, not four -- the navy mockup's fourth card
 * ("Upside potential -8%, 12-month target $12.05") is dropped. No
 * field anywhere in ResearchObject, CommitteeReport, or
 * InvestmentDecisionReport computes a price target or an upside
 * percentage. Adding a fourth card with a fabricated number would
 * be exactly the kind of thing this product's evidence-first trust
 * story exists to prevent -- three honest cards beat four where one
 * is invented.
 */
export default function AIVerdictRow({ research }: WorkstationPanelProps) {
 const { committee, investmentDecision } = research;

 const votingAnalysts = committee.reports.filter(r => r.confidence > 0);
 const avgEvidenceStrength = votingAnalysts.length > 0
 ? Math.round(votingAnalysts.reduce((s, r) => s + r.evidenceStrength, 0) / votingAnalysts.length)
 : null;

 const risks = investmentDecision?.riskRadar.risks ?? [];
 const topSeverity = risks.length > 0 ? Math.max(...risks.map(r => r.severity)) : null;
 const riskLevel = topSeverity === null ? null : topSeverity >= 70 ? "HIGH" : topSeverity >= 40 ? "MEDIUM" : "LOW";
 const riskColor = riskLevel === "HIGH" ? "text-red-400" : riskLevel === "MEDIUM" ? "text-amber-400" : "text-emerald-400";

 return (
 <div className="grid gap-3 sm:grid-cols-3">
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <p className="text-xs text-zinc-500">AI Verdict</p>
 <p className={`mt-1 text-2xl font-bold ${RECOMMENDATION_COLOR[committee.recommendation] ?? "text-zinc-300"}`}>
 {getRecommendationLabel(committee.recommendation)}
 </p>
 <p className="mt-1 text-xs text-zinc-500">{committee.confidence}% confidence - {committee.agreement}% agreement</p>
 <p className="mt-0.5 text-[10px] text-zinc-600">Full committee (all 15 analysts) - some other views of this research use a News-Analyst-excluded number instead, which may differ from this.</p>
 </div>

 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <p className="text-xs text-zinc-500">Evidence Quality</p>
 <p className="mt-1 text-2xl font-bold text-white">
 {avgEvidenceStrength !== null ? `${avgEvidenceStrength}%` : "-"}
 </p>
 <p className="mt-1 text-xs text-zinc-500">
 Average across {votingAnalysts.length} analysts with a real opinion
 </p>
 </div>

 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <p className="text-xs text-zinc-500">Risk Level</p>
 <p className={`mt-1 text-2xl font-bold ${riskLevel ? riskColor : "text-zinc-500"}`}>
 {riskLevel ?? "N/A"}
 </p>
 <p className="mt-1 text-xs text-zinc-500">
 {risks.length > 0
 ? `From ${risks.length} flagged risk${risks.length === 1 ? "" : "s"} across the committee`
 : "No risks flagged, or full research not yet run"}
 </p>
 </div>
 </div>
 );
}
