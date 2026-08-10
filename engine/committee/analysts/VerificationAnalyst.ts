import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import type { EvidenceItem } from "../../evidence/types";

/**
 * A meta-analyst: it doesn't judge the company, it judges the
 * evidence about the company. Walks every evidence item in the
 * package and reports how much of it is verified/high-confidence
 * vs unverified/low-confidence, so the committee's overall
 * conviction can be weighted by how trustworthy its inputs are.
 */
export class VerificationAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Verification Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const items = this.collectEvidenceItems(input);

    const verifiedCount = items.filter(item => item.verified).length;
    const verifiedShare = items.length > 0
      ? verifiedCount / items.length
      : 0;

    const avgConfidence = items.length > 0
      ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length
      : 0;

    const recommendation =
      verifiedShare >= 0.95 && avgConfidence >= 90
        ? "STRONG_BUY"
        : verifiedShare >= 0.8
        ? "BUY"
        : verifiedShare >= 0.6
        ? "HOLD"
        : verifiedShare >= 0.4
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(verifiedShare * 100))
    );

    const unverifiedFields = items.filter(item => !item.verified);

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence: Math.round(avgConfidence),

      evidenceStrength: score,

      thesis:
        `${verifiedCount}/${items.length} evidence items are verified, at an average confidence of ${avgConfidence.toFixed(0)}%.`,

      evidence: [
        {
          category: "Verification",
          metric: "Verified Evidence Share",
          value: Math.round(verifiedShare * 100),
          source: "INTERNAL",
          confidence: Math.round(avgConfidence),
          verified: true,
          collectedAt: new Date()
        }
      ],

      assumptions: [],

      risks:
        verifiedShare < 0.6
          ? [
              {
                category: "Verification",
                severity: verifiedShare < 0.4 ? "HIGH" : "MEDIUM",
                description: "A significant share of the underlying evidence is unverified."
              }
            ]
          : [],

      unknowns:
        unverifiedFields.length > 0
          ? [`${unverifiedFields.length} evidence field(s) are unverified.`]
          : [],

      monitoring: [
        {
          title: "Evidence Verification Rate",
          description: "Track verified/unverified mix as new providers are added.",
          priority: "LOW"
        }
      ]

    };

  }

  private collectEvidenceItems(
    input: EvidencePackage
  ): EvidenceItem<unknown>[] {

    return [
      ...Object.values(input.financial),
      ...Object.values(input.management),
      ...Object.values(input.ipo),
      ...Object.values(input.market),
      ...Object.values(input.industry)
    ] as unknown as EvidenceItem<unknown>[];

  }

}
