export type Recommendation =
  | "Strong Buy"
  | "Buy"
  | "Watch"
  | "Hold"
  | "Avoid";

export type Grade =
  | "A+"
  | "A"
  | "B+"
  | "B"
  | "C"
  | "D";

export type RiskLevel =
  | "Low"
  | "Medium"
  | "High";

export interface AIAnalysis {
  score: number;

  conviction: number;

  confidence: number;

  stars: number;

  grade: Grade;

  recommendation: Recommendation;

  expectedReturn: string;

  risk: RiskLevel;

  summary: string;

  bullCase: string[];

  bearCase: string[];

  catalysts: string[];

  warnings: string[];

  reasons: string[];
}

export type AIReport = AIAnalysis;