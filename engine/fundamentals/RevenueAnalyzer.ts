import { FinancialStatement } from "@/engine/types/FinancialStatement";
import { AnalysisResult } from "@/engine/types/AnalysisResult";

export class RevenueAnalyzer {
  analyze(statements: FinancialStatement[]): AnalysisResult {
    if (statements.length < 2) {
      return {
        score: 0,
        confidence: 0,
        summary: "Not enough financial history.",
        strengths: [],
        weaknesses: ["Insufficient financial history"],
        evidence: [],
      };
    }

    const first = statements[0].revenue;
    const last = statements[statements.length - 1].revenue;

    if (first <= 0) {
      return {
        score: 0,
        confidence: 0,
        summary: "Invalid starting revenue.",
        strengths: [],
        weaknesses: ["Starting revenue must be greater than zero"],
        evidence: [],
      };
    }

    const growth = ((last - first) / first) * 100;

    let score = 30;

    if (growth > 100) score = 100;
    else if (growth > 50) score = 90;
    else if (growth > 25) score = 80;
    else if (growth > 10) score = 70;
    else if (growth > 0) score = 60;

    return {
      score,
      confidence: 0.90,
      summary: `Revenue increased ${growth.toFixed(1)}% across the reporting period.`,
      strengths: growth > 25 ? ["Strong revenue growth"] : [],
      weaknesses: growth <= 10 ? ["Weak revenue growth"] : [],
      evidence: [],
    };
  }
}
