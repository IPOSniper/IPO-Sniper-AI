import type { DueDiligenceResult } from "./DueDiligenceResult";

export interface DueDiligenceReport {

    analyst: string;

    overallScore: number;

    confidence: number;

    completedChecks: number;

    totalChecks: number;

    findings: DueDiligenceResult[];

}
