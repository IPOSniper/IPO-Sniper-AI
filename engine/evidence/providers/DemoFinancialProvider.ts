import {
  FinancialProvider,
  FinancialSnapshot,
} from "./FinancialProvider";

export class DemoFinancialProvider
  implements FinancialProvider
{
  async getFinancials(
    ticker: string
  ): Promise<FinancialSnapshot> {

    return {

      // Current Metrics
      revenueGrowth: 32,
      grossMargin: 48,
      operatingMargin: 12,

      // Cash Flow
      operatingCashFlow: 125,
      freeCashFlow: 82,

      // Balance Sheet
      cashAndEquivalents: 510,
      totalDebt: 140,
      debtToEquity: 0.27,

      // Liquidity
      currentRatio: 2.4,
      quickRatio: 1.9,

      // Valuation
      peRatio: 28,
      psRatio: 6.5,
      evToRevenue: 5.2,

      // Historical Data
      revenueHistory: [
        180,
        205,
        240,
        290,
        340,
        410,
      ],

      grossMarginHistory: [
        39,
        41,
        43,
        45,
        47,
        48,
      ],

      operatingMarginHistory: [
        2,
        4,
        6,
        8,
        10,
        12,
      ],

    };
  }
}
