import type { InvestigationFinding } from "../findings/InvestigationFinding";

export interface InvestigationReport {

    analyst: string;

    completedQuestions: number;

    totalQuestions: number;

    overallConfidence: number;

    overallScore: number;

    findings: InvestigationFinding[];

}
