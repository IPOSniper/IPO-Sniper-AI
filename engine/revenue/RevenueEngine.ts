import { IntelligenceEngine } from "../intelligence/IntelligenceEngine";
import { IntelligenceCategory } from "../intelligence/models/IntelligenceCategory";
import { IntelligenceReport } from "../intelligence/contracts/IntelligenceReport";

import { EvidenceEngine } from "../evidence/evidenceEngine";

export class RevenueEngine extends IntelligenceEngine {

    private readonly evidence =
        new EvidenceEngine();

    public async analyze(
        symbol: string
    ): Promise<IntelligenceReport> {

        const evidence =
            await this.evidence.build(symbol);

        const growth =
            evidence.financial.revenueGrowth.value;

        let score = 30;
        let grade = "D";
        let recommendation = "Sell";

        if (growth >= 30) {
            score = 95;
            grade = "A";
            recommendation = "Strong Buy";
        }
        else if (growth >= 20) {
            score = 85;
            grade = "B";
            recommendation = "Buy";
        }
        else if (growth >= 10) {
            score = 75;
            grade = "C";
            recommendation = "Buy";
        }
        else if (growth >= 0) {
            score = 60;
            grade = "C";
            recommendation = "Hold";
        }

        return {

            category:
                IntelligenceCategory.Revenue,

            score: {
                overall: score,
                confidence: 100,
                grade
            },

            findings: [],

            summary:
                `${symbol} revenue growth is ${growth.toFixed(2)}%.`,

            recommendation,

            generatedAt:
                new Date()

        };

    }

}
