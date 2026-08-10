import type { BrainResult } from "../brain/BrainResult";
import type { ConvictionResult } from "./ConvictionResult";

export class ConvictionEngine {

    evaluate(
        brain: BrainResult
    ): ConvictionResult {

        const score =
            brain.findings.length === 0
                ? 0
                : brain.findings.reduce(
                    (sum, finding) => sum + finding.score,
                    0
                ) / brain.findings.length;

        let recommendation: ConvictionResult["recommendation"];

        if (score >= 85) {
            recommendation = "Strong Buy";
        } else if (score >= 70) {
            recommendation = "Buy";
        } else if (score >= 50) {
            recommendation = "Hold";
        } else {
            recommendation = "Avoid";
        }

        return {

            score,

            confidence: brain.confidence,

            recommendation,

            reasoning:
                brain.findings.map(
                    finding => finding.summary
                )

        };

    }

}
