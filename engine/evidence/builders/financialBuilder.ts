import { EvidenceBuilder } from "../types";
import { FinancialEvidence } from "../package";

import {
  FinancialProvider,
} from "../providers/FinancialProvider";

import {
  FinnhubFinancialProvider,
} from "../providers/FinnhubFinancialProvider";

export class FinancialBuilder
  implements EvidenceBuilder<FinancialEvidence>
{
  private readonly provider: FinancialProvider;

  constructor(
    provider: FinancialProvider = new FinnhubFinancialProvider()
  ) {
    this.provider = provider;
  }

  async build(
    ticker = "DEMO"
  ): Promise<FinancialEvidence> {

    const financials =
      await this.provider.getFinancials(ticker);

    const now = new Date();

const source = "FINNHUB";

    return {

      // ============================
      // Growth
      // ============================

      revenueGrowth: {
        value: financials.revenueGrowth,
        source,
        confidence: 100,
        verified: true,
        collectedAt: now,
      },

      revenueHistory: {
        value: financials.revenueHistory,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      // ============================
      // Profitability
      // ============================

      grossMargin: {
        value: financials.grossMargin,
        source,
        confidence: 100,
        verified: true,
        collectedAt: now,
      },

      // NOTE: this is a single real data point ([currentGrossMargin])
      // wrapped to satisfy the number[] history shape, not genuine
      // multi-period history. confidence lowered from 100 to reflect
      // that a trend can't actually be derived from it.
      grossMarginHistory: {
        value: financials.grossMarginHistory,
        source,
        confidence: 40,
        verified: true,
        collectedAt: now,
      },

      operatingMargin: {
        value: financials.operatingMargin,
        source,
        confidence: 100,
        verified: true,
        collectedAt: now,
      },

      // Same caveat as grossMarginHistory above: single real point,
      // not genuine history.
      operatingMarginHistory: {
        value: financials.operatingMarginHistory,
        source,
        confidence: 40,
        verified: true,
        collectedAt: now,
      },

      // ============================
      // Cash Flow
      // ============================

      operatingCashFlow: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      freeCashFlow: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      // ============================
      // Balance Sheet
      // ============================

      cashAndEquivalents: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      totalDebt: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      debtToEquity: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      // ============================
      // Liquidity
      // ============================

      currentRatio: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      quickRatio: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      // ============================
      // Valuation
      // ============================

      peRatio: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      psRatio: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      evToRevenue: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      // ============================
      // Guidance & Execution
      // ============================

      revenueGuidance: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      epsGuidance: {
        value: 0,
        source,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

    };
  }
}




