import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

export class BalanceSheetAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Balance Sheet Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const debtToEquity = input.financial.debtToEquity.value;
    const cash = input.financial.cashAndEquivalents.value;
    const debt = input.financial.totalDebt.value;

    if (input.financial.debtToEquity.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["debtToEquity", "cashAndEquivalents", "totalDebt"]);
    }


    const netCashPosition = cash - debt;

    const recommendation =
      debtToEquity <= 0.3
        ? "STRONG_BUY"
        : debtToEquity <= 0.6
        ? "BUY"
        : debtToEquity <= 1
        ? "HOLD"
        : debtToEquity <= 2
        ? "REDUCE"
        : "SELL";

    // Lower leverage scores higher; 0 D/E -> 100, 2+ D/E -> 0.
    const score = Math.max(
      0,
      Math.min(100, Math.round(100 - debtToEquity * 50))
    );

    const confidence = Math.round(
      (input.financial.debtToEquity.confidence +
        input.financial.totalDebt.confidence) / 2
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `Debt-to-equity is ${debtToEquity.toFixed(2)}, with ${
          netCashPosition >= 0 ? "net cash" : "net debt"
        } of ${Math.abs(netCashPosition).toLocaleString()}.`,

      evidence: [
        {
          category: "Balance Sheet",
          metric: "Debt-to-Equity",
          value: debtToEquity,
          source: input.financial.debtToEquity.source,
          confidence: input.financial.debtToEquity.confidence,
          verified: input.financial.debtToEquity.verified,
          collectedAt: input.financial.debtToEquity.collectedAt
        },
        {
          category: "Balance Sheet",
          metric: "Net Cash Position",
          value: netCashPosition,
          source: input.financial.totalDebt.source,
          confidence: input.financial.totalDebt.confidence,
          verified: input.financial.totalDebt.verified,
          collectedAt: input.financial.totalDebt.collectedAt
        }
      ],

      assumptions: [],

      risks:
        debtToEquity > 1
          ? [
              {
                category: "Balance Sheet",
                severity: debtToEquity > 2 ? "HIGH" : "MEDIUM",
                description: "Leverage is elevated relative to equity."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Debt-to-Equity Trend",
          description: "Monitor future leverage changes each quarter.",
          priority: "MEDIUM"
        }
      ]

    };

  }

}
