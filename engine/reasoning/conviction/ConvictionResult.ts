export interface ConvictionResult {

    score: number;

    confidence: number;

    recommendation: "Strong Buy" | "Buy" | "Hold" | "Avoid";

    reasoning: string[];

}
