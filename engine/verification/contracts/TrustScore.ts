/**
 * Trust score assigned during evidence verification.
 */
export interface TrustScore {
    score: number;
    confidence: number;
    reason: string;
}
