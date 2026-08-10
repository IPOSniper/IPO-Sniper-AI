import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";

export class MarginAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Margin Analyst";
  readonly version = "1.0.0";

  async analyze(input: EvidencePackage): Promise<AnalystReport> {

    const margin = input.financial.grossMargin.value;

    const recommendation =
      margin >= 60
        ? "STRONG_BUY"
        : margin >= 40
        ? "BUY"
        : margin >= 20
        ? "HOLD"
        : margin >= 10
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(margin))
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence: input.financial.grossMargin.confidence,

      evidenceStrength: input.financial.grossMargin.confidence,

      thesis: `Gross margin is ${margin.toFixed(1)}%.`,

      evidence: [
        {
          category: "Profitability",
          metric: "Gross Margin",
          value: margin,
          source: input.financial.grossMargin.source,
          confidence: input.financial.grossMargin.confidence,
          verified: input.financial.grossMargin.verified,
          collectedAt: input.financial.grossMargin.collectedAt
        }
      ],

      assumptions: [],

      risks:
        margin < 20
          ? [
              {
                category: "Profitability",
                severity: "MEDIUM",
                description: "Margins are below desirable levels."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Gross Margin Trend",
          description: "Monitor future quarterly margin changes.",
          priority: "HIGH"
        }
      ]

    };

  }

}
