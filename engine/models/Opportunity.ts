export type OpportunityRecommendation =
  | "Strong Buy"
  | "Buy"
  | "Hold"
  | "Avoid";

export interface Opportunity {
  id: string;

  ticker: string;

  companyName: string;

  recommendation: OpportunityRecommendation;

  conviction: number;

  confidence: number;

  reasons: string[];

  catalyst?: string;

  updatedAt: Date;
}