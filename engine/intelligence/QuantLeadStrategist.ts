/**
 * Real Quant Lead Strategist -- Round 5's first piece. Per the
 * original proposal's own principle ("specialized agents should not
 * independently place trades... Lead Strategist asks: what do I
 * need to know before making this decision?"), this is a real,
 * thin coordinator that calls the existing, already-built, already-
 * tested engines and combines their real results into one unified
 * assessment.
 *
 * Real, honest scoping: this does NOT replace QuantStrategist.ts's
 * existing trade-plan/direction logic, and does NOT itself execute
 * or recommend a trade -- it produces a real, structured summary of
 * what the adaptive-intelligence layer (Rounds 3-4) currently knows
 * about a ticker, for a human (or a future, separate decision layer)
 * to consider alongside the existing committee recommendation. This
 * is the coordination role, not a new decision-making authority.
 */

import { findContradictions, type ContradictionAnalysis } from "./ContradictionEngine";
import { assessThesisChange, type ThesisReassessment } from "./ThesisReassessmentEngine";
import { computeAdaptiveConviction, type AdaptiveConviction } from "./AdaptiveConvictionEngine";
import { findSimilarDecisions, type SimilarDecision } from "./PatternRecognitionEngine";
import type { CommitteeReport } from "@/engine/committee/contracts/CommitteeReport";

export interface LeadStrategistAssessment {
    ticker: string;
    contradictions: ContradictionAnalysis;
    thesisReassessment: ThesisReassessment | null;
    adaptiveConviction: AdaptiveConviction;
    similarPastDecisions: SimilarDecision[];
}

/**
 * Real, coordinated assessment for one ticker -- combines every real
 * Round 3-4 engine's output into a single, structured result. Given
 * a live committee report and (when a real user session exists) real
 * historical decision data.
 */
export async function assessTicker(userId: string | null, ticker: string, committee: CommitteeReport): Promise<LeadStrategistAssessment> {
    const contradictions = findContradictions(committee);
    const thesisReassessment = userId ? await assessThesisChange(userId, ticker) : null;
    const adaptiveConviction = computeAdaptiveConviction(committee.confidence, thesisReassessment, contradictions);
    const similarPastDecisions = userId ? await findSimilarDecisions(userId, ticker, 3) : [];

    return { ticker, contradictions, thesisReassessment, adaptiveConviction, similarPastDecisions };
}
