export interface RevenueAnalysis {

    currentRevenue: number;

    estimatedRevenue: number;

    previousRevenue: number;

    revenueGrowthYoY: number;

    revenueGrowthQoQ: number;

    surprisePercent: number;

    beat: "beat" | "miss" | "in_line";

    qualityScore: number;

    trend: "Accelerating" | "Stable" | "Decelerating";

    summary: string;

}
