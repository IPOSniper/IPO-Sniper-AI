import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { Risk } from "../contracts/types";
import type { EvidencePackage } from "../../evidence/package";

import { FinancialAnalyst } from "../../analysts/financial/FinancialAnalyst";

/**
 * Adapts FinancialAnalyst (which runs the real investigation-based
 * due-diligence pipeline: KnowledgeEngine -> InvestigationExecutor
 * against FinancialInvestigationPlan) into the committee's standard
 * AnalystReport shape.
 *
 * Previously this hardcoded recommendation: "HOLD", score: 75, and
 * empty evidence/risks regardless of what the underlying analyst
 * found. It now maps the real per-hypothesis findings through.
 */
export class FinancialAnalystAdapter
  implements Analyst<EvidencePackage> {

  readonly name = "Financial Analyst";
  readonly version = "2.0";

  private readonly analyst =
    new FinancialAnalyst();

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const report =
      this.analyst.analyze(input);

    const findings = report.findings;

    const averageScore = findings.length > 0
      ? findings.reduce((sum, f) => sum + f.score, 0) / findings.length
      : 0;

    const passedShare = findings.length > 0
      ? findings.filter(f => f.passed).length / findings.length
      : 0;

    const recommendation =
      passedShare >= 0.9 && averageScore >= 80
        ? "STRONG_BUY"
        : passedShare >= 0.7
        ? "BUY"
        : passedShare >= 0.5
        ? "HOLD"
        : passedShare >= 0.3
        ? "REDUCE"
        : "SELL";

    const risks: Risk[] = findings
      .filter(f => !f.passed || f.risks.length > 0)
      .flatMap(f =>
        f.risks.length > 0
          ? f.risks.map(description => ({
              category: "Financial",
              severity: (f.score < 40 ? "HIGH" : f.score < 65 ? "MEDIUM" : "LOW") as Risk["severity"],
              description
            }))
          : [{
              category: "Financial",
              severity: (f.score < 40 ? "HIGH" : "MEDIUM") as Risk["severity"],
              description: f.summary
            }]
      );

    return {
      analyst: report.analyst,

      recommendation,

      score: Math.round(averageScore),

      confidence: Math.round(report.overallConfidence),

      evidenceStrength: Math.round(report.overallConfidence),

      // Real bug fixed: this used report.summary directly, a
      // hardcoded binary "Financial due diligence passed." /
      // "...identified concerns." sentence, even though every real
      // finding already has its own specific, computed summary text
      // (used correctly right below in `evidence`). Every other
      // analyst's thesis states real, specific numbers - this one
      // was the sole exception showing generic boilerplate. Now
      // builds the thesis from the real per-hypothesis summaries.
      thesis: findings.length > 0
        ? findings.map(f => f.summary).join(" ")
        : report.summary,

      evidence: findings.map(f => ({
        category: "Financial",
        metric: f.hypothesisId,
        value: f.summary,
        source: "INTERNAL" as const,
        confidence: Math.round(f.confidence),
        verified: f.passed,
        collectedAt: new Date()
      })),

      assumptions: findings
        .flatMap(f => f.assumptions)
        .map(statement => ({ statement, confidence: Math.round(report.overallConfidence) })),

      risks,

      unknowns: findings.flatMap(f => f.contradictingFacts),

      monitoring: findings
        .flatMap(f => f.monitoringItems)
        .map(title => ({
          title,
          description: `Follow-up from financial due diligence: ${title}.`,
          priority: "MEDIUM" as const
        })),
    };
  }
}
