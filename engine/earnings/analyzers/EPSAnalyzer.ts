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

            // Real bug fixed: >= treated an EXACT tie as a real
            // "Beat" - same class of bug as RevenueAnalyzer, fixed
            // the same way with a genuine third state.
            beat:
                actualEPS > estimatedEPS ? "beat" :
                actualEPS === estimatedEPS ? "in_line" :
                "miss",

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
                `EPS ${actualEPS > estimatedEPS ? "beat" : actualEPS === estimatedEPS ? "matched" : "missed"} estimates${actualEPS === estimatedEPS ? "" : ` by ${Math.abs(surprise).toFixed(1)}%`}.`

        };

    }

}
