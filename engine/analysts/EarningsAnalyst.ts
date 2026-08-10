export interface EarningsOpinion {
  score: number;
  confidence: number;
  thesis: string;
}

export async function analyzeEarnings(
  ticker: string
): Promise<EarningsOpinion> {

  return {
    score: 81,
    confidence: 89,
    thesis:
      "Recent earnings exceeded analyst expectations."
  };

}
