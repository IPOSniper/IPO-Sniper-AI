export interface CompanySection {
    ticker: string;
    name: string;
    exchange: string;
    sector: string;
    industry: string;
}

export interface MarketSection {
    price: number;
    change: number;
    percentChange: number;
    marketCap: number;
    volume: number;
}

export interface RecommendationSection {
    recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "REDUCE" | "SELL";
    conviction: number;
    confidence: number;
    targetPrice?: number;
    investmentHorizon: string;
}

export interface AnalystVote {
    analyst: string;
    score: number;
    confidence: number;
    summary: string;
}

export interface CommitteeSection {
    overallScore: number;
    agreement: number;
    analysts: AnalystVote[];
}

export interface ExecutiveSummarySection {
    summary: string;
}

export interface InvestmentThesisSection {
    bullCase: string;
    bearCase: string;
}

export interface EvidenceSection {
    items: string[];
}

export interface FinancialSection {}

export interface ValuationSection {}

export interface CatalystSection {}

export interface RiskSection {}

export interface EarningsSection {}

export interface NewsSection {}

export interface FilingSection {}

export interface TimelineSection {}

export interface MetadataSection {
    generatedAt: string;
}

export interface ResearchWorkstation {
    company: CompanySection;
    market: MarketSection;
    recommendation: RecommendationSection;
    committee: CommitteeSection;
    executiveSummary: ExecutiveSummarySection;
    investmentThesis: InvestmentThesisSection;
    evidence: EvidenceSection;
    financials: FinancialSection;
    valuation: ValuationSection;
    catalysts: CatalystSection;
    risks: RiskSection;
    earnings: EarningsSection;
    news: NewsSection;
    filings: FilingSection;
    timeline: TimelineSection;
    metadata: MetadataSection;
}
