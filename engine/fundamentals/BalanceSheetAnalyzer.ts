import { FinancialStatement } from "../types/FinancialStatement";
import { AnalysisResult } from "../types/AnalysisResult";

export class BalanceSheetAnalyzer {

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

    const debtToEquity =
      latest.shareholdersEquity > 0
        ? latest.debt / latest.shareholdersEquity
        : 0;

    const cashToDebt =
      latest.debt > 0
        ? latest.cash / latest.debt
        : latest.cash > 0
          ? 999
          : 0;

    let score = 50;

    if (debtToEquity < 0.50) {

      score += 20;

    } else if (debtToEquity < 1.00) {

      score += 10;

    }

    if (cashToDebt > 1.00) {

      score += 20;

    } else if (cashToDebt > 0.50) {

      score += 10;

    }

    score = Math.min(score, 100);

    const strengths: string[] = [];

    if (debtToEquity < 0.50) {
      strengths.push("Low debt relative to equity.");
    }

    if (cashToDebt > 1.00) {
      strengths.push("Cash exceeds total debt.");
    }

    const weaknesses: string[] = [];

    if (debtToEquity >= 1.00) {
      weaknesses.push("High debt relative to equity.");
    }

    if (cashToDebt < 0.50) {
      weaknesses.push("Limited cash relative to debt.");
    }

    return {

      score,

      confidence: 90,

      summary:
        `Debt/Equity: ${debtToEquity.toFixed(2)}, ` +
        `Cash/Debt: ${cashToDebt.toFixed(2)}`,

      strengths,

      weaknesses,

      evidence: []

    };

  }

}