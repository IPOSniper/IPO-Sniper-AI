export interface InstitutionalOpinion {
  score: number;
  confidence: number;
  thesis: string;
}

export async function analyzeInstitutional(
  ticker: string
): Promise<InstitutionalOpinion> {

  return {
    score: 88,
    confidence: 93,
    thesis:
      "Institutional ownership continues to increase."
  };

}
