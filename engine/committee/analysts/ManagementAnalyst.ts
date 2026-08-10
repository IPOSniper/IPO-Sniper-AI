import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

export class ManagementAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Management Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const founderLed = input.management.founderLed.value;
    const insiderOwnership = input.management.insiderOwnership.value;
    const executiveTenure = input.management.executiveTenure.value;

    if (input.management.insiderOwnership.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["founderLed", "insiderOwnership", "executiveTenure"]);
    }


    let points = 0;
    if (founderLed) points += 2;
    if (insiderOwnership >= 15) points += 2;
    else if (insiderOwnership >= 5) points += 1;
    if (executiveTenure >= 5) points += 1;

    const recommendation =
      points >= 4
        ? "STRONG_BUY"
        : points >= 3
        ? "BUY"
        : points >= 1
        ? "HOLD"
        : points === 0 && insiderOwnership < 2
        ? "REDUCE"
        : "HOLD";

    const score = Math.max(
      0,
      Math.min(100, Math.round((points / 5) * 100))
    );

    const confidence = Math.round(
      (input.management.founderLed.confidence +
        input.management.insiderOwnership.confidence +
        input.management.executiveTenure.confidence) / 3
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `${founderLed ? "Founder-led" : "Non-founder-led"} with ${insiderOwnership.toFixed(1)}% insider ownership and an average executive tenure of ${executiveTenure.toFixed(1)} years.`,

      evidence: [
        {
          category: "Management",
          metric: "Insider Ownership",
          value: insiderOwnership,
          source: input.management.insiderOwnership.source,
          confidence: input.management.insiderOwnership.confidence,
          verified: input.management.insiderOwnership.verified,
          collectedAt: input.management.insiderOwnership.collectedAt
        },
        {
          category: "Management",
          metric: "Founder-Led",
          value: founderLed,
          source: input.management.founderLed.source,
          confidence: input.management.founderLed.confidence,
          verified: input.management.founderLed.verified,
          collectedAt: input.management.founderLed.collectedAt
        }
      ],

      assumptions: [],

      risks:
        insiderOwnership < 2
          ? [
              {
                category: "Management",
                severity: "MEDIUM",
                description: "Low insider ownership means weaker alignment with shareholders."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Insider Transactions",
          description: "Monitor future insider buying or selling activity.",
          priority: "MEDIUM"
        }
      ]

    };

  }

}
