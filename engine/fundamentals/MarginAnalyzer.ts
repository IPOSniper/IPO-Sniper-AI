import { FinancialStatement } from "../types/FinancialStatement";
import { AnalysisResult } from "../types/AnalysisResult";

export class MarginAnalyzer {
  analyze(
    statements: FinancialStatement[]
  ): AnalysisResult {

    if (statements.length === 0) {
      return {
        score: 0,
        confidence: 0,
        summary: "No financial statements available.",
        strengths: [],
        weaknesses: ["No data"],
        evidence: [],
      };
    }

    const latest = statements[0];

    const grossMargin =
      latest.revenue > 0
        ? (latest.grossProfit / latest.revenue) * 100
        : 0;

    const operatingMargin =
      latest.revenue > 0
        ? (latest.operatingIncome / latest.revenue) * 100
        : 0;

    const netMargin =
      latest.revenue > 0
        ? (latest.netIncome / latest.revenue) * 100
        : 0;

    let score = 50;

    if (grossMargin > 60) score += 20;
    else if (grossMargin > 40) score += 10;

    if (operatingMargin > 20) score += 15;
    else if (operatingMargin > 10) score += 8;

    if (netMargin > 15) score += 15;
    else if (netMargin > 5) score += 8;

    score = Math.min(score, 100);

    return {
      score,
      confidence: 0.9,
      summary: `Gross Margin ${grossMargin.toFixed(
        1
      )}% | Operating Margin ${operatingMargin.toFixed(
        1
      )}% | Net Margin ${netMargin.toFixed(1)}%`,
      strengths: grossMargin > 40
        ? ["Healthy gross margins"]
        : [],
      weaknesses: grossMargin < 20
        ? ["Weak gross margins"]
        : [],
      evidence: [],
    };
  }
}