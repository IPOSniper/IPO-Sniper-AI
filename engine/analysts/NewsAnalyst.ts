export interface NewsOpinion {
  score: number;
  confidence: number;
  thesis: string;
}

export async function analyzeNews(
  ticker: string
): Promise<NewsOpinion> {

  return {
    score: 79,
    confidence: 85,
    thesis:
      "Recent news flow remains favorable."
  };

}
