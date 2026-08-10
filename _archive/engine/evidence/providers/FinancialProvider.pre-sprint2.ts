export interface FinancialSnapshot {

  // ============================
  // Current Metrics
  // ============================

  revenueGrowth: number;
  grossMargin: number;
  operatingMargin: number;

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
