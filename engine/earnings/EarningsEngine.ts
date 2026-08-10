import { IntelligenceEngine } from "../intelligence/IntelligenceEngine";
import { IntelligenceCategory } from "../intelligence/models/IntelligenceCategory";
import { IntelligenceReport } from "../intelligence/contracts/IntelligenceReport";
import { EarningsPipeline } from "./EarningsPipeline";

export class EarningsEngine extends IntelligenceEngine {

    private readonly pipeline =
        new EarningsPipeline();

    public async analyze(
        symbol: string
    ): Promise<IntelligenceReport> {

        const earnings =
            await this.pipeline.provider.getLatest(symbol);

        const revenue =
            this.pipeline.revenueAnalyzer.analyze(
                earnings.actualRevenue,
                earnings.estimatedRevenue,
                // Real prior-period actual, not the estimate reused
                // as a stand-in. When Finnhub has no prior row,
                // RevenueAnalyzer's own previousRevenue===0 branch
                // reports growth as 0 rather than comparing against
                // an unrelated number.
                earnings.previousRevenue ?? 0
            );

        const eps =
            this.pipeline.epsAnalyzer.analyze(
                earnings.actualEPS,
                earnings.estimatedEPS,
                earnings.previousEPS ?? 0
            );

        const score =
            (revenue.qualityScore + eps.qualityScore) / 2;

        return {

            category: IntelligenceCategory.Earnings,

            score: {

                overall: score,

                confidence: score,

                grade:
                    score >= 90
                        ? "A"
                        : score >= 80
                        ? "B"
                        : score >= 70
                        ? "C"
                        : "D"

            },

            findings: [],

            summary:
                `${symbol} reported EPS ${earnings.actualEPS} vs ${earnings.estimatedEPS}.`,

            recommendation:
                score >= 80
                    ? "Bullish"
                    : "Neutral",

            generatedAt:
                new Date()

        };

    }

}
