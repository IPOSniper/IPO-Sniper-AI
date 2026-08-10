export interface WeightedScores {
  thesis: number;
  fundamentals: number;
  valuation: number;
  float: number;
  insiders: number;
  macro: number;
  risk: number;
}

export function weightedScore(
  scores: WeightedScores
): number {

  const result =

      scores.thesis * 0.25 +

      scores.fundamentals * 0.25 +

      scores.valuation * 0.15 +

      scores.float * 0.15 +

      scores.insiders * 0.10 +

      scores.macro * 0.05 +

      scores.risk * 0.05;

  return Math.round(result);
}