export interface CompanyFinancials {
  company: string;

  marketCap?: number;

  revenue?: number;

  revenueGrowth?: number;

  grossMargin?: number;

  operatingMargin?: number;

  earnings?: number;

  debtToEquity?: number;

  sharesOutstanding?: number;

  publicFloat?: number;

  insiderOwnership?: number;

  institutionalOwnership?: number;

  sector?: string;

  industry?: string;
}