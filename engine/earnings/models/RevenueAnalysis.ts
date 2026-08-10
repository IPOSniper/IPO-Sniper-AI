export interface RevenueAnalysis {

    currentRevenue: number;

    estimatedRevenue: number;

    previousRevenue: number;

    revenueGrowthYoY: number;

    revenueGrowthQoQ: number;

    surprisePercent: number;

    beat: boolean;

    qualityScore: number;

    trend: "Accelerating" | "Stable" | "Decelerating";

    summary: string;

}
