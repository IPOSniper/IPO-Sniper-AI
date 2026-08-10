export interface EPSAnalysis {

    actualEPS: number;

    estimatedEPS: number;

    previousEPS: number;

    epsGrowth: number;

    surprisePercent: number;

    beat: boolean;

    qualityScore: number;

    summary: string;

}
