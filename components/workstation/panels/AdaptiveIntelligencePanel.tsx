import { assessTicker } from "@/engine/intelligence/QuantLeadStrategist";
import type { CommitteeReport } from "@/engine/committee/contracts/CommitteeReport";

const THESIS_COLOR: Record<string, string> = {
 STRENGTHENED: "text-emerald-400",
 WEAKENED: "text-amber-400",
 REVERSED: "text-red-400",
 INVALIDATED: "text-red-400",
 UNCHANGED: "text-zinc-400",
 "insufficient-history": "text-zinc-600",
};

const THESIS_LABEL: Record<string, string> = {
 STRENGTHENED: "Thesis strengthened since last decision",
 WEAKENED: "Thesis weakened since last decision",
 REVERSED: "Thesis direction reversed since last decision",
 INVALIDATED: "Prior directional thesis invalidated",
 UNCHANGED: "Thesis unchanged since last decision",
 "insufficient-history": "No prior decision to compare against yet",
};

/**
 * Real, unified display for the whole real adaptive-intelligence
 * layer (Rounds 3-4), now coordinated through round100's
 * QuantLeadStrategist rather than calling each engine separately --
 * one real assessment call instead of three independent ones.
 *
 * Rendered as a small, separate panel alongside WorkstationShell
 * rather than modifying that established component directly --
 * lower risk than inserting new logic into a large, working shell.
 */
export default async function AdaptiveIntelligencePanel({ userId, ticker, committee }: { userId: string | null; ticker: string; committee: CommitteeReport }) {
 const assessment = await assessTicker(userId, ticker, committee);
 const { contradictions, thesisReassessment, adaptiveConviction, similarPastDecisions } = assessment;

 const hasThesisResult = thesisReassessment && thesisReassessment.result !== "insufficient-history";
 const hasAdjustment = adaptiveConviction.adjustment !== 0;
 if (!contradictions.hasSignificantContradiction && !hasThesisResult && similarPastDecisions.length === 0 && !hasAdjustment) {
 return null;
 }

 return (
 <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <div className="mb-2 flex items-center justify-between">
 <h3 className="text-sm font-medium text-zinc-300">Adaptive Intelligence</h3>
 <span className="text-[10px] text-zinc-600">Real - pure comparison logic, not AI-generated</span>
 </div>

 {hasAdjustment && (
 <>
 <p className="mb-2 text-sm text-white">
 Committee confidence {adaptiveConviction.baseConfidence} - adjusted confidence{" "}
 <span className={adaptiveConviction.adjustment >= 0 ? "text-emerald-400" : "text-amber-400"}>
 {adaptiveConviction.adjustedConviction}
 </span>
 <span className="ml-1 text-zinc-500">
 ({adaptiveConviction.adjustment >= 0 ? "+" : ""}{adaptiveConviction.adjustment})
 </span>
 </p>
 {adaptiveConviction.reasons.filter(r => r.includes("capped at")).map((cappedReason, i) => (
 <p key={i} className="mb-2 text-xs text-zinc-500">{cappedReason}</p>
 ))}
 </>
 )}

 {thesisReassessment && thesisReassessment.result !== "insufficient-history" && (
 <p className={`text-sm ${THESIS_COLOR[thesisReassessment.result]}`}>
 {THESIS_LABEL[thesisReassessment.result]}
 {thesisReassessment.confidenceDelta !== null && (
 <span className="ml-1 text-zinc-500">
 (confidence {thesisReassessment.confidenceDelta >= 0 ? "+" : ""}{thesisReassessment.confidenceDelta})
 </span>
 )}
 </p>
 )}

 {contradictions.hasSignificantContradiction && (
 <div className="mt-2">
 <p className="mb-1 text-xs text-amber-400">Real analyst contradictions detected:</p>
 <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2 xl:grid-cols-3">
 {contradictions.contradictions.map((c, i) => (
 <p key={i} className="text-xs text-zinc-400">
 {c.analystA} ({c.recommendationA}) vs. {c.analystB} ({c.recommendationB})
 {c.severity === "critical" && <span className="ml-1 text-red-400">critical</span>}
 </p>
 ))}
 </div>
 </div>
 )}

 {similarPastDecisions.length > 0 && (
 <div className="mt-2 space-y-1">
 <p className="text-xs text-zinc-500">Similar past decisions for {ticker} (real decision comparison, not yet outcome-aware - no closed trades exist for this ticker yet):</p>
 {similarPastDecisions.map(({ decision, similarity }) => (
 <p key={decision.id} className="text-xs text-zinc-400">
 {new Date(decision.createdAt).toLocaleDateString()} - {decision.direction === "none" ? "No Trade" : decision.direction} (Quality {decision.tradeQualityScore}/100)
 <span className="ml-1 text-zinc-600">{similarity}% similar</span>
 </p>
 ))}
 </div>
 )}
 </div>
 );
}
