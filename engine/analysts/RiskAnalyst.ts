export interface RiskOpinion {
  score: number;
  confidence: number;
  thesis: string;
}

export async function analyzeRisk(
  ticker: string
): Promise<RiskOpinion> {

  return {
    score: 61,
    confidence: 77,
    thesis:
      "Execution and valuation remain the primary risks."
  };

}
