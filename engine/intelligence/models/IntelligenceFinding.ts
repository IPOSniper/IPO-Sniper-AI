export interface IntelligenceFinding {

    title: string;

    description: string;

    impact: "Bullish" | "Bearish" | "Neutral";

    confidence: number;

    evidence: string[];

}
