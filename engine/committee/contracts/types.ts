// engine/committee/contracts/types.ts

export type Recommendation =
  | "STRONG_BUY"
  | "BUY"
  | "HOLD"
  | "REDUCE"
  | "SELL";

export type Priority =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type Severity =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type EvidenceSource =
  | "FINNHUB"
  | "SEC"
  | "POLYGON"
  | "YAHOO"
  | "NASDAQ"
  | "FMP"
  | "INTERNAL";

export interface Evidence {

  category: string;

  metric: string;

  value: unknown;

  source: EvidenceSource;

  confidence: number;

  verified: boolean;

  collectedAt: Date;

}

export interface Assumption {

  statement: string;

  confidence: number;

}

export interface Risk {

  category: string;

  severity: Severity;

  description: string;

}

export interface MonitoringItem {

  title: string;

  description: string;

  priority: Priority;

}