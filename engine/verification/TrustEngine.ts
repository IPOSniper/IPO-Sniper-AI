import { TrustScore } from "./contracts/TrustScore";

export class TrustEngine {

    public calculate(score: number, reason: string): TrustScore {

        const normalizedScore = Math.max(0, Math.min(100, score));

        return {
            score: normalizedScore,
            confidence: normalizedScore / 100,
            reason
        };
    }

}
