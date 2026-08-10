import { AnalysisResult } from "../types/AnalysisResult";
import { BusinessFundamentalsResult } from "./BusinessFundamentalsEngine";

export class FinancialHealthEngine {

  evaluate(
    fundamentals: BusinessFundamentalsResult
  ): AnalysisResult {

    const weightedScore = Math.round(

      (
        fundamentals.revenue.score * 0.25 +
        fundamentals.margin.score * 0.30 +
        fundamentals.balanceSheet.score * 0.25 +
        fundamentals.cashFlow.score * 0.20

      )

    );

    const confidence = Math.round(

      (
        fundamentals.revenue.confidence +
        fundamentals.margin.confidence +
        fundamentals.balanceSheet.confidence +
        fundamentals.cashFlow.confidence

      ) / 4

    );

    return {

      score: weightedScore,

      confidence,

      summary:
        `Overall Financial Health Score: ${weightedScore}/100`,

      strengths: [

        ...fundamentals.revenue.strengths,
        ...fundamentals.margin.strengths,
        ...fundamentals.balanceSheet.strengths,
        ...fundamentals.cashFlow.strengths

      ],

      weaknesses: [

        ...fundamentals.revenue.weaknesses,
        ...fundamentals.margin.weaknesses,
        ...fundamentals.balanceSheet.weaknesses,
        ...fundamentals.cashFlow.weaknesses

      ],

      evidence: [

        ...fundamentals.revenue.evidence,
        ...fundamentals.margin.evidence,
        ...fundamentals.balanceSheet.evidence,
        ...fundamentals.cashFlow.evidence

      ]

    };

  }

}
