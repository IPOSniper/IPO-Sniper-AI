// engine/committee/ChiefInvestmentOfficer.ts

import type { Analyst } from "./contracts/Analyst";
import type { AnalystReport } from "./contracts/AnalystReport";
import type { Recommendation } from "./contracts/types";
import type { CommitteeReport } from "./contracts/CommitteeReport";

export class ChiefInvestmentOfficer<TInput> {
  constructor(
    private readonly analysts: Analyst<TInput>[]
  ) {}

  async analyze(input: TInput): Promise<CommitteeReport> {
    const allReports = await Promise.all(
      this.analysts.map((analyst) => analyst.analyze(input))
    );

    // Reports with confidence 0 are "insufficient data" reports (see
    // engine/committee/analysts/shared/insufficientData.ts) — they
    // carry no opinion and must not be averaged in as if they were a
    // real bearish vote. They still appear in `reports` below so the
    // UI can show which analysts didn't run, they just don't move
    // the aggregate score/confidence/agreement/recommendation.
    const reports = allReports;
    const scoredReports = allReports.filter(r => r.confidence > 0);

    const overallScore = this.average(
      scoredReports.map((report) => report.score)
    );

    const confidence = this.average(
      scoredReports.map((report) => report.confidence)
    );

    const agreement = this.calculateAgreement(scoredReports);
    const recommendation = this.determineRecommendation(overallScore);

    return {
      reports,
      recommendation,
      overallScore,
      confidence,
      agreement,
      summary: this.buildSummary(
        recommendation,
        overallScore,
        confidence,
        agreement,
        scoredReports,
        reports.length - scoredReports.length
      ),
      generatedAt: new Date(),
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const total = values.reduce((sum, value) => sum + value, 0);

    return Math.round(total / values.length);
  }

  private calculateAgreement(
    reports: AnalystReport[]
  ): number {
    if (reports.length === 0) {
      return 0;
    }

    const votes = new Map<Recommendation, number>();

    for (const report of reports) {
      votes.set(
        report.recommendation,
        (votes.get(report.recommendation) ?? 0) + 1
      );
    }

    const majority = Math.max(...votes.values());

    return Math.round((majority / reports.length) * 100);
  }

  private determineRecommendation(
    score: number
  ): Recommendation {
    if (score >= 90) return "STRONG_BUY";
    if (score >= 80) return "BUY";
    if (score >= 65) return "HOLD";
    if (score >= 50) return "REDUCE";
    return "SELL";
  }

  private buildSummary(
    recommendation: Recommendation,
    score: number,
    confidence: number,
    agreement: number,
    scoredReports: AnalystReport[],
    excludedCount: number
  ): string {
    const bullish = scoredReports.filter(
      (report) =>
        report.recommendation === "BUY" ||
        report.recommendation === "STRONG_BUY"
    ).length;

    const bearish = scoredReports.filter(
      (report) =>
        report.recommendation === "SELL" ||
        report.recommendation === "REDUCE"
    ).length;

    const lines = [
      `Committee Recommendation: ${recommendation}`,
      `Overall Score: ${score}`,
      `Confidence: ${confidence}%`,
      `Agreement: ${agreement}%`,
      `Bullish Analysts: ${bullish}`,
      `Bearish Analysts: ${bearish}`,
    ];

    if (excludedCount > 0) {
      lines.push(
        `${excludedCount} analyst(s) excluded from scoring — insufficient verified data.`
      );
    }

    return lines.join("\n");
  }
}