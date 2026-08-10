import type { AnalystReport } from "./contracts/AnalystReport";
import type { CommitteeReport } from "./contracts/CommitteeReport";
import type { Recommendation } from "./contracts/types";

export class CommitteeChair {
  summarize(reports: AnalystReport[]): CommitteeReport {
    const overallScore = Math.round(
      reports.reduce((sum, r) => sum + r.score, 0) /
      Math.max(reports.length, 1)
    );

    const confidence = Math.round(
      reports.reduce((sum, r) => sum + r.confidence, 0) /
      Math.max(reports.length, 1)
    );

    const agreement = this.calculateAgreement(reports);

    const recommendation: Recommendation =
      overallScore >= 90
        ? "STRONG_BUY"
        : overallScore >= 80
        ? "BUY"
        : overallScore >= 65
        ? "HOLD"
        : overallScore >= 50
        ? "REDUCE"
        : "SELL";

    return {
      reports,
      recommendation,
      overallScore,
      confidence,
      agreement,
      summary: reports.map(r => r.thesis).join(" "),
      generatedAt: new Date(),
    };
  }

  private calculateAgreement(
    reports: AnalystReport[]
  ): number {

    if (reports.length === 0) return 0;

    const average =
      reports.reduce((s, r) => s + r.score, 0) /
      reports.length;

    const variance =
      reports.reduce(
        (s, r) => s + Math.pow(r.score - average, 2),
        0
      ) / reports.length;

    return Math.max(
      0,
      100 - Math.round(Math.sqrt(variance))
    );
  }
}
