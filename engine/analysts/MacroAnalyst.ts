export interface MacroOpinion {
  score: number;
  confidence: number;
  thesis: string;
}

export async function analyzeMacro(
  ticker: string
): Promise<MacroOpinion> {

  return {
    score: 76,
    confidence: 80,
    thesis:
      "Macro conditions remain supportive for long-term growth."
  };

}
