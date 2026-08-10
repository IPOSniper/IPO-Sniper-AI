export interface WeightedScore {
    score: number;
    weight: number;
}

export class ScoringEngine {

    static weightedAverage(
        scores: WeightedScore[]
    ): number {

        if (scores.length === 0)
            return 0;

        const totalWeight =
            scores.reduce(
                (s, x) => s + x.weight,
                0
            );

        if (totalWeight === 0)
            return 0;

        const total =
            scores.reduce(
                (s, x) =>
                    s + (x.score * x.weight),
                0
            );

        return Math.round(total / totalWeight);
    }
}
