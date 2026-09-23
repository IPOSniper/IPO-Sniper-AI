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


    // Real bug fixed: this used to read founderLed/executiveTenure
    // even when THEIR OWN confidence was 0 (no real data), silently
    // treating "unknown" as "confirmed false/0" and penalizing every
    // company on two axes it never actually had data for. Now each
    // sub-field only contributes to the score when it clears the
    // same MIN_USABLE_CONFIDENCE bar the top-level gate uses.
    const founderLedConfident = input.management.founderLed.confidence >= MIN_USABLE_CONFIDENCE;
    const executiveTenureConfident = input.management.executiveTenure.confidence >= MIN_USABLE_CONFIDENCE;
    const maxPoints = 3 + (founderLedConfident ? 2 : 0) + (executiveTenureConfident ? 1 : 0);

    let points = 0;
    if (founderLedConfident && founderLed) points += 2;
    if (insiderOwnership >= 15) points += 2;
    else if (insiderOwnership >= 5) points += 1;
    if (executiveTenureConfident && executiveTenure >= 5) points += 1;

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
      Math.min(100, Math.round((points / Math.max(maxPoints, 1)) * 100))
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
        `${insiderOwnership.toFixed(1)}% insider ownership (real, from recent Form 4 filings).` +
        (founderLedConfident ? ` ${founderLed ? "Founder-led" : "Non-founder-led"}.` : ` Founder-led status: not currently available.`) +
        (executiveTenureConfident ? ` Average executive tenure ${executiveTenure.toFixed(1)} years.` : ` Executive tenure: not currently available.`),

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
