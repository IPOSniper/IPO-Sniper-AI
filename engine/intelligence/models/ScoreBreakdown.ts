export interface ScoreBreakdown {

    overall: number;

    confidence: number;

    components: {

        growth: number;

        consistency: number;

        acceleration: number;

        margins: number;

        guidance: number;

    };

}
