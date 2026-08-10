export interface GrossMarginAnalysis {

    improving: boolean;

    averageMargin: number;

    confidence: number;

    summary: string;

}

export class GrossMarginInterpreter {

    public interpret(
        grossMargins: number[]
    ): GrossMarginAnalysis {

        if (grossMargins.length < 2) {

            return {

                improving: false,

                averageMargin: 0,

                confidence: 0,

                summary: "Insufficient gross margin history."

            };

        }

        const averageMargin =
            grossMargins.reduce(
                (sum, value) => sum + value,
                0
            ) / grossMargins.length;

        const improving =
            grossMargins[grossMargins.length - 1] >
            grossMargins[0];

        return {

            improving,

            averageMargin,

            confidence:
                improving
                    ? 90
                    : 70,

            summary:
                improving
                    ? "Gross margin is improving."
                    : "Gross margin is not improving."

        };

    }

}
