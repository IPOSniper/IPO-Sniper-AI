export type EvidenceCategory =
  | "financial"
  | "earnings"
  | "sec"
  | "macro"
  | "institutional"
  | "news"
  | "valuation"
  | "industry";

export interface Evidence {
  id: string;
  category: EvidenceCategory;
  title: string;
  value: string | number;
  explanation: string;
  source: string;
  confidence: number;
  updatedAt: Date;
}
