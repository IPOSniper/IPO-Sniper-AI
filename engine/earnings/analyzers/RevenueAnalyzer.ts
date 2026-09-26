import { RevenueAnalysis } from "../models/RevenueAnalysis";

export class RevenueAnalyzer {

    public analyze(

        currentRevenue: number,

        estimatedRevenue: number,

        previousRevenue: number

    ): RevenueAnalysis {

        const growth =
            previousRevenue === 0
                ? 0
                : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

        const surprise =
            estimatedRevenue === 0
                ? 0
                : ((currentRevenue - estimatedRevenue) / estimatedRevenue) * 100;

        return {

            currentRevenue,

            estimatedRevenue,

            previousRevenue,

            revenueGrowthYoY: growth,

            revenueGrowthQoQ: 0,

            surprisePercent: surprise,

            // Real bug fixed: >= treated an EXACT tie ($0.00 vs $0.00,
            // confirmed live on multiple tickers) as a real "Beat" -
            // nothing was actually beaten when the two numbers are
            // equal. Real fix: a genuine third state.
            beat:
                currentRevenue > estimatedRevenue ? "beat" :
                currentRevenue === estimatedRevenue ? "in_line" :
                "miss",

            qualityScore:
    surprise >= 15 ? 100 :
    surprise >= 10 ? 95 :
    surprise >= 5 ? 90 :
    surprise >= 2 ? 85 :
    surprise >= 0 ? 75 :
    surprise >= -5 ? 60 :
    40,

            trend:
                growth > 20
                    ? "Accelerating"
                    : growth > 5
                        ? "Stable"
                        : "Decelerating",

            summary:
                `Revenue ${currentRevenue > estimatedRevenue ? "beat" : currentRevenue === estimatedRevenue ? "matched" : "missed"} expectations${currentRevenue === estimatedRevenue ? "" : ` by ${Math.abs(surprise).toFixed(1)}%`}.`

        };

    }

}
