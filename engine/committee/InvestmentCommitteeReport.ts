import { AnalystOpinion } from "./AnalystOpinion";
import { Evidence } from "./Evidence";
import { Factor } from "./Factor";
import { ThesisTrend } from "./ThesisTrend";

export interface InvestmentCommitteeReport {
  ticker: string;

  companyName: string;

  generatedAt: Date;

  conviction: number;

  rating:
    | "Strong Buy"
    | "Buy"
    | "Hold"
    | "Reduce"
    | "Sell";

  trend: ThesisTrend;

  thesis: string;

  summary: string;

  bullishFactors: Factor[];

  bearishFactors: Factor[];

  evidence: Evidence[];

  analystOpinions: AnalystOpinion[];
}
