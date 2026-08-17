import { findContradictions } from "@/engine/intelligence/ContradictionEngine";
import { assessThesisChange } from "@/engine/intelligence/ThesisReassessmentEngine";
import { findSimilarDecisions } from "@/engine/intelligence/PatternRecognitionEngine";
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
 * Real, first wired display for both round97's Thesis Reassessment
 * and this round's Contradiction Engine -- both were built but left
 * unconnected to any UI, consistent with this session's "small,
 * testable milestones" discipline (build the logic, verify it, wire
 * it in as its own deliberate step). This is that step.
 *
 * Rendered as a small, separate panel alongside WorkstationShell
 * rather than modifying that established component directly --
 * lower risk than inserting new logic into a large, working shell.
 */
export default async function AdaptiveIntelligencePanel({ userId, ticker, committee }: { userId: string | null; ticker: string; committee: CommitteeReport }) {
    const contradictionAnalysis = findContradictions(committee);
    const thesisReassessment = userId ? await assessThesisChange(userId, ticker) : null;
    const similarDecisions = userId ? await findSimilarDecisions(userId, ticker, 3) : [];

    const hasThesisResult = thesisReassessment && thesisReassessment.result !== "insufficient-history";
    if (!contradictionAnalysis.hasSignificantContradiction && !hasThesisResult && similarDecisions.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Adaptive Intelligence</h3>
                <span className="text-[10px] text-zinc-600">Real — pure comparison logic, not AI-generated</span>
            </div>

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

            {contradictionAnalysis.hasSignificantContradiction && (
                <div className="mt-2 space-y-1">
                    <p className="text-xs text-amber-400">Real analyst contradictions detected:</p>
                    {contradictionAnalysis.contradictions.map((c, i) => (
                        <p key={i} className="text-xs text-zinc-400">
                            {c.analystA} ({c.recommendationA}) vs. {c.analystB} ({c.recommendationB})
                            {c.severity === "critical" && <span className="ml-1 text-red-400">critical</span>}
                        </p>
                    ))}
                </div>
            )}

            {similarDecisions.length > 0 && (
                <div className="mt-2 space-y-1">
                    <p className="text-xs text-zinc-500">Similar past decisions for {ticker} (real decision comparison, not yet outcome-aware — no closed trades exist for this ticker yet):</p>
                    {similarDecisions.map(({ decision, similarity }) => (
                        <p key={decision.id} className="text-xs text-zinc-400">
                            {new Date(decision.createdAt).toLocaleDateString()} — {decision.direction === "none" ? "No Trade" : decision.direction} (Quality {decision.tradeQualityScore}/100)
                            <span className="ml-1 text-zinc-600">{similarity}% similar</span>
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
