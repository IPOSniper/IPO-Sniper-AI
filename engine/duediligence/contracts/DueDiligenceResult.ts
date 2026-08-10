export interface DueDiligenceResult {

    checkId: string;

    passed: boolean;

    score: number;

    confidence: number;

    finding: string;

    evidence: string[];

    recommendation: string;

}
