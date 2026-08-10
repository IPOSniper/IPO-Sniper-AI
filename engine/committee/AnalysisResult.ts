export type Recommendation =
  | "STRONG_BUY"
  | "BUY"
  | "HOLD"
  | "REDUCE"
  | "SELL";

export interface AnalysisResult {
  analyst: string;

  recommendation: Recommendation;

  score: number;

  confidence: number;

  summary: string;

  positives: string[];

  negatives: string[];

  watchItems: string[];

  evidence: string[];

  risks: string[];
}