import { ScoreBreakdown } from "../../intelligence/models/ScoreBreakdown";

export interface RevenueInvestigationResult {

    breakdown: ScoreBreakdown;

    findings: string[];

    positives: string[];

    warnings: string[];

    reasoning: string;

    recommendation: string;

}
