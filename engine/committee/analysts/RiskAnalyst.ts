import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

/**
 * A composite analyst: unlike Revenue/Margin/etc. it doesn't own a
 * single evidence field, it aggregates signals other analysts also
 * look at (leverage, liquidity, volatility) into a single downside-
 * risk read. Deliberately overlaps with BalanceSheetAnalyst,
 * LiquidityAnalyst and MarketAnalyst — this analyst asks "how risky
 * is this overall" while those ask "is this metric good."
 */
export class RiskAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Risk Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const debtToEquity = input.financial.debtToEquity.value;
    const currentRatio = input.financial.currentRatio.value;
    const volatility = input.market.volatilityIndex.value;

    if (input.financial.debtToEquity.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["debtToEquity", "currentRatio", "volatilityIndex"]);
    }

    let riskPoints = 0;
    if (debtToEquity > 1) riskPoints += 1;
    if (debtToEquity > 2) riskPoints += 1;
    if (currentRatio < 1) riskPoints += 1;
    if (currentRatio < 0.75) riskPoints += 1;
    if (volatility >= 25) riskPoints += 1;
    if (volatility >= 40) riskPoints += 1;

    // riskPoints ranges 0-6; higher = riskier = worse recommendation.
    const recommendation =
      riskPoints === 0
        ? "STRONG_BUY"
        : riskPoints <= 1
        ? "BUY"
        : riskPoints <= 3
        ? "HOLD"
        : riskPoints <= 4
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(100 - (riskPoints / 6) * 100))
    );

    const confidence = Math.round(
      (input.financial.debtToEquity.confidence +
        input.financial.currentRatio.confidence +
        input.market.volatilityIndex.confidence) / 3
    );

    const risks: AnalystReport["risks"] = [];

    if (debtToEquity > 1) {
      risks.push({
        category: "Risk",
        severity: debtToEquity > 2 ? "HIGH" : "MEDIUM",
        description: "Leverage adds balance sheet risk."
      });
    }

    if (currentRatio < 1) {
      risks.push({
        category: "Risk",
        severity: currentRatio < 0.75 ? "HIGH" : "MEDIUM",
        description: "Short-term liquidity is tight."
      });
    }

    if (volatility >= 25) {
      risks.push({
        category: "Risk",
        severity: volatility >= 40 ? "HIGH" : "MEDIUM",
        description: "Price volatility is elevated."
      });
    }

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `Composite risk score of ${riskPoints}/6 flags: leverage ${debtToEquity.toFixed(2)}x, current ratio ${currentRatio.toFixed(2)}, volatility ${volatility.toFixed(1)}.`,

      evidence: [
        {
          category: "Risk",
          metric: "Composite Risk Points",
          value: riskPoints,
          source: "INTERNAL",
          confidence,
          verified: true,
          collectedAt: new Date()
        }
      ],

      assumptions: [
        {
          statement: "Risk is derived from leverage, liquidity and volatility only; does not include legal, regulatory or key-person risk.",
          confidence: 60
        }
      ],

      risks,

      unknowns: [
        "Legal, regulatory and key-person risks are not captured by this analyst."
      ],

      monitoring: [
        {
          title: "Composite Risk Score",
          description: "Recompute after each new financial or market data refresh.",
          priority: "HIGH"
        }
      ]

    };

  }

}
