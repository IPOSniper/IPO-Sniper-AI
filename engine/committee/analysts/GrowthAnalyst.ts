import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

export class GrowthAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Growth Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const history = input.financial.revenueHistory.value;
    const guidance = input.financial.revenueGuidance.value;

    if (input.financial.revenueGuidance.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["revenueHistory", "revenueGuidance"]);
    }


    const lastActual = history.length > 0
      ? history[history.length - 1]
      : 0;

    // Guidance expressed as expected next-period revenue; compare
    // against the last actual period to get an implied growth rate.
    const impliedGrowth = lastActual !== 0
      ? ((guidance - lastActual) / Math.abs(lastActual)) * 100
      : 0;

    const recommendation =
      impliedGrowth >= 40
        ? "STRONG_BUY"
        : impliedGrowth >= 20
        ? "BUY"
        : impliedGrowth >= 5
        ? "HOLD"
        : impliedGrowth >= -5
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(50 + impliedGrowth))
    );

    const confidence = Math.round(
      (input.financial.revenueHistory.confidence +
        input.financial.revenueGuidance.confidence) / 2
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `Guidance implies ${impliedGrowth.toFixed(1)}% revenue growth versus the last reported period, across ${history.length} periods of history.`,

      evidence: [
        {
          category: "Growth",
          metric: "Implied Guidance Growth",
          value: impliedGrowth,
          source: input.financial.revenueGuidance.source,
          confidence: input.financial.revenueGuidance.confidence,
          verified: input.financial.revenueGuidance.verified,
          collectedAt: input.financial.revenueGuidance.collectedAt
        },
        {
          category: "Growth",
          metric: "Revenue History",
          value: history,
          source: input.financial.revenueHistory.source,
          confidence: input.financial.revenueHistory.confidence,
          verified: input.financial.revenueHistory.verified,
          collectedAt: input.financial.revenueHistory.collectedAt
        }
      ],

      assumptions: [
        {
          statement: "Revenue guidance reflects management's most current outlook.",
          confidence: input.financial.revenueGuidance.confidence
        }
      ],

      risks:
        impliedGrowth < 5
          ? [
              {
                category: "Growth",
                severity: impliedGrowth < 0 ? "HIGH" : "MEDIUM",
                description: "Forward guidance implies decelerating growth."
              }
            ]
          : [],

      unknowns:
        history.length < 4
          ? ["Limited revenue history reduces trend reliability."]
          : [],

      monitoring: [
        {
          title: "Guidance vs Actuals",
          description: "Monitor whether the company meets or misses its own guidance.",
          priority: "HIGH"
        }
      ]

    };

  }

}
