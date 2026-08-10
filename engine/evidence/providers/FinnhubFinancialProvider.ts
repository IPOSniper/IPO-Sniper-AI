import {
  FinancialProvider,
  FinancialSnapshot,
} from "./FinancialProvider";

export class FinnhubFinancialProvider
  implements FinancialProvider
{
  async getFinancials(
    ticker: string
  ): Promise<FinancialSnapshot> {

    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      throw new Error("FINNHUB_API_KEY is missing.");
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub request failed: ${response.status}`);
    }

    const data = await response.json();

    const metric = data.metric ?? {};

    const revenueGrowth =
      metric.revenueGrowthTTMYoy ?? 0;

    const grossMargin =
      metric.grossMargin5Y ??
      metric.grossMarginTTM ??
      0;

    const operatingMargin =
      metric.operatingMarginTTM ??
      0;

    return {

      // Current Metrics
      revenueGrowth,
      grossMargin,
      operatingMargin,

      // Cash Flow
      operatingCashFlow: 0,
      freeCashFlow: 0,

      // Balance Sheet
      cashAndEquivalents: 0,
      totalDebt: 0,
      debtToEquity: 0,

      // Liquidity
      currentRatio: 0,
      quickRatio: 0,

      // Valuation
      peRatio: 0,
      psRatio: 0,
      evToRevenue: 0,

      // Historical Data
      revenueHistory: [],

      grossMarginHistory: [
        grossMargin,
      ],

      operatingMarginHistory: [
        operatingMargin,
      ],

    };
  }
}

