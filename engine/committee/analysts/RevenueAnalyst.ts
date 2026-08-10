import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";

export class RevenueAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Revenue Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const growth = input.financial.revenueGrowth.value;

    const recommendation =
      growth >= 30
        ? "STRONG_BUY"
        : growth >= 15
        ? "BUY"
        : growth >= 5
        ? "HOLD"
        : growth >= 0
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(growth))
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence: input.financial.revenueGrowth.confidence,

      evidenceStrength: input.financial.revenueGrowth.confidence,

      thesis:
        `Revenue growth is ${growth.toFixed(1)}%.`,

      evidence: [
        {
          category: "Growth",
          metric: "Revenue Growth",
          value: growth,
          source: input.financial.revenueGrowth.source,
          confidence: input.financial.revenueGrowth.confidence,
          verified: input.financial.revenueGrowth.verified,
          collectedAt: input.financial.revenueGrowth.collectedAt
        }
      ],

      assumptions: [],

      risks:
        growth < 5
          ? [
              {
                category: "Growth",
                severity: "MEDIUM",
                description: "Revenue growth has slowed."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Quarterly Revenue",
          description: "Monitor future revenue growth trends.",
          priority: "HIGH"
        }
      ]

    };

  }

}
