export interface ValuationOpinion {
  score: number;
  confidence: number;
  thesis: string;
}

export async function analyzeValuation(
  ticker: string
): Promise<ValuationOpinion> {

  return {
    score: 67,
    confidence: 82,
    thesis:
      "Shares trade modestly above intrinsic value estimates."
  };

}
