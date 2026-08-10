import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

/**
 * Unblocked as of the real SecBuilder (engine/evidence/builders/
 * secBuilder.ts) wiring in SEC EDGAR + heuristic prospectus
 * extraction. riskFactorCount is a paragraph count from Item 1A,
 * NOT a severity/quality assessment — a company with more risk
 * factors listed isn't necessarily riskier, some filings are just
 * more verbose. Treat this analyst as "did we find a recent
 * filing and does it look normal," not deep filing analysis.
 */
export class SECAnalyst implements Analyst<EvidencePackage> {

  readonly name = "SEC Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    if (input.sec.latestFiling.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["latestFiling", "riskFactorCount"]);
    }

    const filing = input.sec.latestFiling.value;
    const riskCount = input.sec.riskFactorCount.value;

    // Filing existing and being recent-ish is itself a mild positive
    // signal (good standing, actively reporting); risk factor count
    // is deliberately weighted lightly since it's not a severity
    // measure — see class comment.
    const recommendation =
      riskCount > 0 && riskCount <= 25
        ? "BUY"
        : riskCount > 25 && riskCount <= 45
        ? "HOLD"
        : riskCount > 45
        ? "REDUCE"
        : "HOLD";

    const score = riskCount > 0
      ? Math.max(30, Math.min(85, 85 - riskCount))
      : 50;

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence: input.sec.latestFiling.confidence,

      evidenceStrength: input.sec.riskFactorCount.confidence,

      thesis:
        filing
          ? `Latest filing: ${filing.formType} on ${filing.filedAt}, with ${riskCount} risk-factor paragraph(s) identified.`
          : "No SEC filing found.",

      evidence: [
        {
          category: "SEC",
          metric: "Latest Filing",
          value: filing ? `${filing.formType} (${filing.filedAt})` : "None found",
          source: input.sec.latestFiling.source,
          confidence: input.sec.latestFiling.confidence,
          verified: input.sec.latestFiling.verified,
          collectedAt: input.sec.latestFiling.collectedAt
        },
        {
          category: "SEC",
          metric: "Risk Factor Paragraph Count",
          value: riskCount,
          source: input.sec.riskFactorCount.source,
          confidence: input.sec.riskFactorCount.confidence,
          verified: input.sec.riskFactorCount.verified,
          collectedAt: input.sec.riskFactorCount.collectedAt
        }
      ],

      assumptions: [
        {
          statement: "Risk factor count reflects extraction heuristic limitations, not verified severity — see ProspectusExtractor.ts.",
          confidence: 50
        }
      ],

      risks: riskCount > 45
        ? [
            {
              category: "SEC",
              severity: "MEDIUM",
              description: "Unusually high risk-factor paragraph count in latest filing — worth reading directly."
            }
          ]
        : [],

      unknowns: [
        "Underwriter reputation and risk-factor severity are not assessed by this analyst — see EvidencePackage.sec.underwriters for raw extraction."
      ],

      monitoring: [
        {
          title: "New SEC Filings",
          description: "Re-run when a new 10-Q/10-K/8-K is filed.",
          priority: "MEDIUM"
        }
      ]

    };

  }

}
