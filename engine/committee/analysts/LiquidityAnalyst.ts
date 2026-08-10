import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

export class LiquidityAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Liquidity Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const currentRatio = input.financial.currentRatio.value;
    const quickRatio = input.financial.quickRatio.value;

    if (input.financial.currentRatio.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["currentRatio", "quickRatio"]);
    }


    const recommendation =
      currentRatio >= 2 && quickRatio >= 1.5
        ? "STRONG_BUY"
        : currentRatio >= 1.5
        ? "BUY"
        : currentRatio >= 1
        ? "HOLD"
        : currentRatio >= 0.75
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(currentRatio * 40))
    );

    const confidence = Math.round(
      (input.financial.currentRatio.confidence +
        input.financial.quickRatio.confidence) / 2
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `Current ratio is ${currentRatio.toFixed(2)} and quick ratio is ${quickRatio.toFixed(2)}.`,

      evidence: [
        {
          category: "Liquidity",
          metric: "Current Ratio",
          value: currentRatio,
          source: input.financial.currentRatio.source,
          confidence: input.financial.currentRatio.confidence,
          verified: input.financial.currentRatio.verified,
          collectedAt: input.financial.currentRatio.collectedAt
        },
        {
          category: "Liquidity",
          metric: "Quick Ratio",
          value: quickRatio,
          source: input.financial.quickRatio.source,
          confidence: input.financial.quickRatio.confidence,
          verified: input.financial.quickRatio.verified,
          collectedAt: input.financial.quickRatio.collectedAt
        }
      ],

      assumptions: [],

      risks:
        currentRatio < 1
          ? [
              {
                category: "Liquidity",
                severity: currentRatio < 0.75 ? "HIGH" : "MEDIUM",
                description: "Current liabilities may exceed current assets."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Working Capital Trend",
          description: "Monitor future changes in short-term liquidity.",
          priority: "MEDIUM"
        }
      ]

    };

  }

}
