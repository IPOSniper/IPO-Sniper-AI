export interface FinancialSnapshot {

  // ============================
  // Current Metrics
  // ============================

  revenueGrowth: number;
  grossMargin: number;
  operatingMargin: number;

  // ============================
  // Cash Flow
  // ============================

  operatingCashFlow: number;
  freeCashFlow: number;

  // ============================
  // Balance Sheet
  // ============================

  cashAndEquivalents: number;
  totalDebt: number;
  debtToEquity: number;

  // ============================
  // Liquidity
  // ============================

  currentRatio: number;
  quickRatio: number;

  // ============================
  // Valuation
  // ============================

  peRatio: number;
  psRatio: number;
  evToRevenue: number;

  // ============================
  // Historical Data
  // ============================

  revenueHistory: number[];
  grossMarginHistory: number[];
  operatingMarginHistory: number[];

}

export interface FinancialProvider {

  getFinancials(
    ticker: string
  ): Promise<FinancialSnapshot>;

}
