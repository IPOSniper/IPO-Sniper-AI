import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

export class ValuationAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Valuation Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const peRatio = input.financial.peRatio.value;
    const psRatio = input.financial.psRatio.value;
    const evToRevenue = input.financial.evToRevenue.value;

    if (input.financial.psRatio.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["psRatio", "evToRevenue"]);
    }


    // Many IPO candidates are pre-earnings, so P/E can be negative or
    // near-meaningless. P/S and EV/Revenue are weighted more heavily
    // than P/E for that reason, rather than averaging all three evenly.
    const peSignal = peRatio > 0
      ? peRatio <= 20 ? 1 : peRatio <= 40 ? 0 : -1
      : 0;

    const psSignal =
      psRatio <= 5 ? 1 : psRatio <= 12 ? 0 : -1;

    const evSignal =
      evToRevenue <= 5 ? 1 : evToRevenue <= 12 ? 0 : -1;

    const compositeSignal =
      peSignal * 0.2 + psSignal * 0.4 + evSignal * 0.4;

    const recommendation =
      compositeSignal >= 0.7
        ? "STRONG_BUY"
        : compositeSignal >= 0.2
        ? "BUY"
        : compositeSignal >= -0.2
        ? "HOLD"
        : compositeSignal >= -0.7
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(50 + compositeSignal * 50))
    );

    const confidence = Math.round(
      (input.financial.psRatio.confidence +
        input.financial.evToRevenue.confidence) / 2
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `Trading at ${psRatio.toFixed(1)}x sales and ${evToRevenue.toFixed(1)}x EV/Revenue${peRatio > 0 ? `, ${peRatio.toFixed(1)}x earnings` : " with no meaningful P/E"}.`,

      evidence: [
        {
          category: "Valuation",
          metric: "Price-to-Sales",
          value: psRatio,
          source: input.financial.psRatio.source,
          confidence: input.financial.psRatio.confidence,
          verified: input.financial.psRatio.verified,
          collectedAt: input.financial.psRatio.collectedAt
        },
        {
          category: "Valuation",
          metric: "EV-to-Revenue",
          value: evToRevenue,
          source: input.financial.evToRevenue.source,
          confidence: input.financial.evToRevenue.confidence,
          verified: input.financial.evToRevenue.verified,
          collectedAt: input.financial.evToRevenue.collectedAt
        }
      ],

      assumptions: [
        {
          statement: "P/S and EV/Revenue are weighted above P/E given typical pre-earnings IPO profiles.",
          confidence: 70
        }
      ],

      risks:
        compositeSignal < -0.2
          ? [
              {
                category: "Valuation",
                severity: compositeSignal < -0.7 ? "HIGH" : "MEDIUM",
                description: "Valuation multiples are elevated relative to typical bands."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Multiple Compression/Expansion",
          description: "Monitor how valuation multiples move as fundamentals develop.",
          priority: "MEDIUM"
        }
      ]

    };

  }

}
