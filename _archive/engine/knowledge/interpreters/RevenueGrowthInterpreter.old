export interface RevenueGrowthAnalysis {

    accelerating: boolean;

    quarterlyGrowthRates: number[];

    averageGrowthRate: number;

    confidence: number;

    summary: string;

}

export class RevenueGrowthInterpreter {

    public interpret(
        quarterlyRevenue: number[]
    ): RevenueGrowthAnalysis {

        if (quarterlyRevenue.length < 4) {

            return {

                accelerating: false,

                quarterlyGrowthRates: [],

                averageGrowthRate: 0,

                confidence: 0,

                summary: "Insufficient revenue history."

            };

        }

        const growthRates: number[] = [];

        for (let i = 1; i < quarterlyRevenue.length; i++) {

            const previous = quarterlyRevenue[i - 1];
            const current = quarterlyRevenue[i];

            if (previous === 0) {

                growthRates.push(0);

                continue;

            }

            growthRates.push(((current - previous) / previous) * 100);

        }

        let accelerating = true;

        for (let i = 1; i < growthRates.length; i++) {

            if (growthRates[i] < growthRates[i - 1]) {

                accelerating = false;

                break;

            }

        }

        const averageGrowthRate =
            growthRates.reduce((sum, value) => sum + value, 0) /
            growthRates.length;

        const confidence =
            accelerating
                ? 95
                : 75;

        const summary =
            accelerating
                ? "Revenue growth is accelerating."
                : "Revenue growth is not consistently accelerating.";

        return {

            accelerating,

            quarterlyGrowthRates: growthRates,

            averageGrowthRate,

            confidence,

            summary

        };

    }

}
