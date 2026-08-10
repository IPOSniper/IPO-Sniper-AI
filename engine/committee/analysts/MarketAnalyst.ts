import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

export class MarketAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Market Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const volatility = input.market.volatilityIndex.value;
    const sectorMomentum = input.market.sectorMomentum.value;

    if (input.market.sectorMomentum.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["volatilityIndex", "sectorMomentum"]);
    }


    // Momentum drives the call; elevated volatility caps how bullish
    // the recommendation can go, rather than being an independent axis.
    const momentumSignal =
      sectorMomentum >= 15
        ? 2
        : sectorMomentum >= 5
        ? 1
        : sectorMomentum >= -5
        ? 0
        : sectorMomentum >= -15
        ? -1
        : -2;

    const volatilityCap = volatility >= 40 ? 1 : volatility >= 25 ? 2 : 5;

    const cappedSignal = Math.max(
      -2,
      Math.min(volatilityCap, momentumSignal)
    );

    const recommendation =
      cappedSignal >= 2
        ? "STRONG_BUY"
        : cappedSignal >= 1
        ? "BUY"
        : cappedSignal >= 0
        ? "HOLD"
        : cappedSignal >= -1
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(50 + cappedSignal * 20 - Math.max(0, volatility - 25)))
    );

    const confidence = Math.round(
      (input.market.volatilityIndex.confidence +
        input.market.sectorMomentum.confidence) / 2
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `Sector momentum is ${sectorMomentum.toFixed(1)}% with a volatility index of ${volatility.toFixed(1)}.`,

      evidence: [
        {
          category: "Market",
          metric: "Sector Momentum",
          value: sectorMomentum,
          source: input.market.sectorMomentum.source,
          confidence: input.market.sectorMomentum.confidence,
          verified: input.market.sectorMomentum.verified,
          collectedAt: input.market.sectorMomentum.collectedAt
        },
        {
          category: "Market",
          metric: "Volatility Index",
          value: volatility,
          source: input.market.volatilityIndex.source,
          confidence: input.market.volatilityIndex.confidence,
          verified: input.market.volatilityIndex.verified,
          collectedAt: input.market.volatilityIndex.collectedAt
        }
      ],

      assumptions: [],

      risks:
        volatility >= 25
          ? [
              {
                category: "Market",
                severity: volatility >= 40 ? "HIGH" : "MEDIUM",
                description: "Elevated volatility increases near-term price risk."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Sector Momentum",
          description: "Monitor whether sector momentum sustains or reverses.",
          priority: "MEDIUM"
        }
      ]

    };

  }

}
