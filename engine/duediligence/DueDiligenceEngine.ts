import type { DueDiligenceCheck } from "./contracts/DueDiligenceCheck";
import type { DueDiligenceReport } from "./contracts/DueDiligenceReport";
import type { DueDiligenceResult } from "./contracts/DueDiligenceResult";

export class DueDiligenceEngine {

    execute(
        analyst: string,
        checks: DueDiligenceCheck[]
    ): DueDiligenceReport {

        const results = checks.map(c => this.executeCheck(c));

        return {

            analyst,

            overallScore: this.calculateScore(results),

            confidence: this.calculateConfidence(results),

            completedChecks: results.length,

            totalChecks: checks.length,

            findings: results

        };

    }

    private executeCheck(
        check: DueDiligenceCheck
    ): DueDiligenceResult {

        return {

            checkId: check.id,

            passed: false,

            score: 0,

            confidence: 0,

            finding: "",

            evidence: [],

            recommendation: ""

        };

    }

    private calculateScore(
        results: DueDiligenceResult[]
    ): number {

        if (!results.length) return 0;

        return (
            results.reduce((a, r) => a + r.score, 0) /
            results.length
        );

    }

    private calculateConfidence(
        results: DueDiligenceResult[]
    ): number {

        if (!results.length) return 0;

        return (
            results.reduce((a, r) => a + r.confidence, 0) /
            results.length
        );

    }

}
