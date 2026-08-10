import { EPSAnalysis } from "../models/EPSAnalysis";

export class EPSAnalyzer {

    public analyze(

        actualEPS: number,

        estimatedEPS: number,

        previousEPS: number

    ): EPSAnalysis {

        const growth =
            previousEPS === 0
                ? 0
                : ((actualEPS - previousEPS) / Math.abs(previousEPS)) * 100;

        const surprise =
            estimatedEPS === 0
                ? 0
                : ((actualEPS - estimatedEPS) / Math.abs(estimatedEPS)) * 100;

        return {

            actualEPS,

            estimatedEPS,

            previousEPS,

            epsGrowth: growth,

            surprisePercent: surprise,

            beat: actualEPS >= estimatedEPS,

            // Was hardcoded to 75 regardless of input — a fabricated
            // number wearing the shape of a real score. Tiered off
            // the actual surprise, same scale as RevenueAnalyzer's
            // qualityScore so the two are comparable.
            qualityScore:
                surprise >= 15 ? 100 :
                surprise >= 10 ? 95 :
                surprise >= 5 ? 90 :
                surprise >= 2 ? 85 :
                surprise >= 0 ? 75 :
                surprise >= -5 ? 60 :
                40,

            summary:
                `EPS ${actualEPS >= estimatedEPS ? "beat" : "missed"} estimates by ${surprise.toFixed(1)}%.`

        };

    }

}
