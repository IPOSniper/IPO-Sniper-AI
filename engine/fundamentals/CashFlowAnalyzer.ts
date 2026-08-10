import { FinancialStatement } from "../types/FinancialStatement";
import { AnalysisResult } from "../types/AnalysisResult";

export class CashFlowAnalyzer {

  analyze(
    statements: FinancialStatement[]
  ): AnalysisResult {

    if (statements.length === 0) {

      return {
        score: 0,
        confidence: 0,
        summary: "No financial statements available.",
        strengths: [],
        weaknesses: [
          "No financial statements were provided."
        ],
        evidence: []
      };

    }

    const latest = statements[0];

    const freeCashFlow = latest.freeCashFlow;

    const fcfMargin =
      latest.revenue > 0
        ? (freeCashFlow / latest.revenue) * 100
        : 0;

    let score = 50;

    if (fcfMargin > 20) {
      score += 30;
    } else if (fcfMargin > 10) {
      score += 20;
    } else if (fcfMargin > 5) {
      score += 10;
    }

    score = Math.min(score, 100);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (fcfMargin > 15) {
      strengths.push("Strong free cash flow generation.");
    }

    if (freeCashFlow > 0) {
      strengths.push("Positive free cash flow.");
    }

    if (freeCashFlow < 0) {
      weaknesses.push("Negative free cash flow.");
    }

    if (fcfMargin < 5) {
      weaknesses.push("Weak free cash flow margin.");
    }

    return {
      score,
      confidence: 90,
      summary:
        `Free Cash Flow: $${(freeCashFlow / 1000000000).toFixed(1)}B, ` +
        `FCF Margin: ${fcfMargin.toFixed(1)}%`,
      strengths,
      weaknesses,
      evidence: []
    };

  }

}
