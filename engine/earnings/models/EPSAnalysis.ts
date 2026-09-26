export interface EPSAnalysis {

    actualEPS: number;

    estimatedEPS: number;

    previousEPS: number;

    epsGrowth: number;

    surprisePercent: number;

    beat: "beat" | "miss" | "in_line";

    qualityScore: number;

    summary: string;

}
