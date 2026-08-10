import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

export class IndustryAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Industry Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const tam = input.industry.tam.value;
    const industryGrowth = input.industry.industryGrowth.value;

    if (input.industry.industryGrowth.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["tam", "industryGrowth"]);
    }


    const recommendation =
      industryGrowth >= 20 && tam >= 10_000_000_000
        ? "STRONG_BUY"
        : industryGrowth >= 10
        ? "BUY"
        : industryGrowth >= 3
        ? "HOLD"
        : industryGrowth >= 0
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(50 + industryGrowth * 2))
    );

    const confidence = Math.round(
      (input.industry.tam.confidence +
        input.industry.industryGrowth.confidence) / 2
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `${company(input)} operates in a market growing at ${industryGrowth.toFixed(1)}% annually with a TAM of ${(tam / 1_000_000_000).toFixed(1)}B.`,

      evidence: [
        {
          category: "Industry",
          metric: "Total Addressable Market",
          value: tam,
          source: input.industry.tam.source,
          confidence: input.industry.tam.confidence,
          verified: input.industry.tam.verified,
          collectedAt: input.industry.tam.collectedAt
        },
        {
          category: "Industry",
          metric: "Industry Growth Rate",
          value: industryGrowth,
          source: input.industry.industryGrowth.source,
          confidence: input.industry.industryGrowth.confidence,
          verified: input.industry.industryGrowth.verified,
          collectedAt: input.industry.industryGrowth.collectedAt
        }
      ],

      assumptions: [],

      risks:
        industryGrowth < 3
          ? [
              {
                category: "Industry",
                severity: industryGrowth < 0 ? "HIGH" : "MEDIUM",
                description: "Industry growth is slow, limiting the addressable tailwind."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Industry Growth Rate",
          description: "Monitor sector-wide growth trends and TAM revisions.",
          priority: "LOW"
        }
      ]

    };

  }

}

function company(input: EvidencePackage): string {
  return input.company.name || input.company.ticker;
}
