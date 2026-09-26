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
 *
 * Real explainer added: this panel was showing real, correct data
 * (confidence adjustments, contradiction pairs, a "critical" tag)
 * with zero explanation of what any of it means or why it's shown --
 * confirmed directly from a new investor's real confusion. The
 * "critical" vs "notable" distinction and the real cap on the
 * contradiction penalty are both genuine, deliberate design choices
 * (see ContradictionEngine.ts / AdaptiveConvictionEngine.ts) that
 * were previously invisible to the reader. Also fixes a real, small
 * bug: "high"-severity contradictions rendered with NO severity tag
 * at all, unlike "critical" ones -- both now get a real, visible tag.
 */
export default async function AdaptiveIntelligencePanel({ userId, ticker, committee }: { userId: string | null; ticker: string; committee: CommitteeReport }) {
 const assessment = await assessTicker(userId, ticker, committee);
 const { contradictions, thesisReassessment, adaptiveConviction, similarPastDecisions } = assessment;

 const hasThesisResult = thesisReassessment && thesisReassessment.result !== "insufficient-history";
 const hasAdjustment = adaptiveConviction.adjustment !== 0;
 if (!contradictions.hasSignificantContradiction && !hasThesisResult && similarPastDecisions.length === 0 && !hasAdjustment) {
 return null;
 }

 const showDisagreementIntro = hasAdjustment || contradictions.hasSignificantContradiction;

 return (
 <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <div className="mb-2 flex items-center justify-between">
 <h3 className="text-sm font-medium text-zinc-300">Adaptive Intelligence</h3>
 <span className="text-[10px] text-zinc-600">Real - pure comparison logic, not AI-generated</span>
 </div>

 {showDisagreementIntro && (
 <div className="mb-3">
 <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Why we show this</p>
 <p className="text-xs text-zinc-400">
 Most research tools give you one clean verdict and stop there. IPO Sniper AI doesn&apos;t hide the disagreement behind it -- if the analysts inside the Committee don&apos;t actually agree with each other, you should know that, because it changes how much weight the final verdict deserves.
 </p>
 </div>
 )}

 {hasAdjustment && (
 <div className="mb-3">
 <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Confidence Adjustment</p>
 <p className="mb-1 text-sm text-white">
 Committee confidence {adaptiveConviction.baseConfidence} - adjusted confidence{" "}
 <span className={adaptiveConviction.adjustment >= 0 ? "text-emerald-400" : "text-amber-400"}>
 {adaptiveConviction.adjustedConviction}
 </span>
 <span className="ml-1 text-zinc-500">
 ({adaptiveConviction.adjustment >= 0 ? "+" : ""}{adaptiveConviction.adjustment})
 </span>
 </p>
 {adaptiveConviction.reasons.filter(r => r.includes("capped at")).map((cappedReason, i) => (
 <p key={i} className="text-xs text-zinc-500">{cappedReason}</p>
 ))}
 {contradictions.hasSignificantContradiction && (
 <p className="mt-1 text-xs text-zinc-500">
 Every real disagreement lowers how much you should trust the verdict -- but a couple of analysts who disagree with everyone else can create many individual disagreements just by being outliers. We cap the total penalty so that doesn&apos;t overstate things, and show what the penalty would have been without the cap, so you can see how much real tension there was.
 </p>
 )}
 </div>
 )}

 {thesisReassessment && thesisReassessment.result !== "insufficient-history" && (
 <div className="mb-3">
 <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Thesis Change</p>
 <p className={`text-sm ${THESIS_COLOR[thesisReassessment.result]}`}>
 {THESIS_LABEL[thesisReassessment.result]}
 {thesisReassessment.confidenceDelta !== null && (
 <span className="ml-1 text-zinc-500">
 (confidence {thesisReassessment.confidenceDelta >= 0 ? "+" : ""}{thesisReassessment.confidenceDelta})
 </span>
 )}
 </p>
 </div>
 )}

 {contradictions.hasSignificantContradiction && (
 <div className="mt-2">
 <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Analyst Disagreements</p>
 <p className="mb-2 text-xs text-zinc-500">
 <span className="text-zinc-300">Notable</span> = opposite-leaning calls (e.g. Buy vs. Reduce). <span className="text-red-400">Critical</span> = full opposite extremes (Strong Buy vs. Sell) -- as far apart as two opinions can get.
 </p>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-600">
 <th className="py-1 pr-2 font-semibold">Analyst</th>
 <th className="py-1 pr-2 font-semibold">Call</th>
 <th className="py-1 pr-2 font-semibold"></th>
 <th className="py-1 pr-2 font-semibold">Analyst</th>
 <th className="py-1 pr-2 font-semibold">Call</th>
 <th className="py-1 text-right font-semibold">Severity</th>
 </tr>
 </thead>
 <tbody>
 {[...contradictions.contradictions]
 .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1))
 .map((c, i) => (
 <tr key={i} className="border-b border-zinc-900 text-zinc-400">
 <td className="py-1 pr-2">{c.analystA}</td>
 <td className="py-1 pr-2 text-zinc-300">{c.recommendationA}</td>
 <td className="py-1 pr-2 text-zinc-700">vs.</td>
 <td className="py-1 pr-2">{c.analystB}</td>
 <td className="py-1 pr-2 text-zinc-300">{c.recommendationB}</td>
 <td className={"py-1 text-right " + (c.severity === "critical" ? "text-red-400" : "text-zinc-500")}>
 {c.severity === "critical" ? "Critical" : "Notable"}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {similarPastDecisions.length > 0 && (
 <div className="mt-3 space-y-1">
 <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Similar Past Decisions</p>
 <p className="text-xs text-zinc-500">For {ticker} (real decision comparison, not yet outcome-aware - no closed trades exist for this ticker yet):</p>
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