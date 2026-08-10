import { EvidenceItem } from "./types";
import type { Company } from "../models/Company";
import type { FinancialStatement } from "../types/FinancialStatement";

export interface FinancialEvidence {

  // ============================
  // Growth
  // ============================

  revenueGrowth: EvidenceItem<number>;
  revenueHistory: EvidenceItem<number[]>;

  // ============================
  // Profitability
  // ============================

  grossMargin: EvidenceItem<number>;
  grossMarginHistory: EvidenceItem<number[]>;

  operatingMargin: EvidenceItem<number>;
  operatingMarginHistory: EvidenceItem<number[]>;

  // ============================
  // Cash Flow
  // ============================

  operatingCashFlow: EvidenceItem<number>;
  freeCashFlow: EvidenceItem<number>;

  // ============================
  // Balance Sheet
  // ============================

  cashAndEquivalents: EvidenceItem<number>;
  totalDebt: EvidenceItem<number>;
  debtToEquity: EvidenceItem<number>;

  // ============================
  // Liquidity
  // ============================

  currentRatio: EvidenceItem<number>;
  quickRatio: EvidenceItem<number>;

  // ============================
  // Valuation
  // ============================

  peRatio: EvidenceItem<number>;
  psRatio: EvidenceItem<number>;
  evToRevenue: EvidenceItem<number>;

  // ============================
  // Guidance & Execution
  // ============================

  revenueGuidance: EvidenceItem<number>;
  epsGuidance: EvidenceItem<number>;
}

export interface ManagementEvidence {
  founderLed: EvidenceItem<boolean>;
  insiderOwnership: EvidenceItem<number>;
  executiveTenure: EvidenceItem<number>;
}

export interface IPOEvidence {
  floatShares: EvidenceItem<number>;
  ipoPrice: EvidenceItem<number>;
  ipoDate: EvidenceItem<string | null>;
  underwriters: EvidenceItem<string[]>;
}

export interface MarketEvidence {
  volatilityIndex: EvidenceItem<number>;
  sectorMomentum: EvidenceItem<number>;
}

export interface IndustryEvidence {
  tam: EvidenceItem<number>;
  industryGrowth: EvidenceItem<number>;
}

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface NewsEvidence {
  articleCount: EvidenceItem<number>;
  // Heuristic keyword-based polarity, NOT real NLP sentiment — see
  // the comment in engine/evidence/builders/newsBuilder.ts for the
  // exact method and its known limitations before trusting this.
  sentimentScore: EvidenceItem<number>;
  recentArticles: EvidenceItem<NewsArticle[]>;
}

export interface SecFilingRef {
  formType: string;
  filedAt: string;
  accessionNumber: string;
  url: string;
}

export interface SecEvidence {
  latestFiling: EvidenceItem<SecFilingRef | null>;
  underwriters: EvidenceItem<string[]>;
  // Count of risk-factor paragraphs found via heuristic section
  // splitting of Item 1A — NOT a quality/severity assessment of the
  // risks themselves. See ProspectusExtractor.ts.
  riskFactorCount: EvidenceItem<number>;
}

export interface QuoteEvidence {
  price: EvidenceItem<number>;
  changePercent: EvidenceItem<number>;
  marketCap: EvidenceItem<number>;
}

export interface FinancialStatementsEvidence {
  // One EvidenceItem wrapping the whole multi-year array, not one
  // per field — this is a single fetch producing historical data,
  // not independently-sourced current-period metrics like
  // FinancialEvidence above. Same pattern as NewsEvidence.recentArticles.
  statements: EvidenceItem<FinancialStatement[]>;
}

export interface EvidencePackage {
  company: Company;

  financial: FinancialEvidence;
  management: ManagementEvidence;
  ipo: IPOEvidence;
  market: MarketEvidence;
  industry: IndustryEvidence;
  news: NewsEvidence;
  sec: SecEvidence;
  quote: QuoteEvidence;
  financialStatements: FinancialStatementsEvidence;
}
