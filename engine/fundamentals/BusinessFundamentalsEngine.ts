import { FinancialStatement } from "../types/FinancialStatement";
import { AnalysisResult } from "../types/AnalysisResult";

import { RevenueAnalyzer } from "./RevenueAnalyzer";
import { MarginAnalyzer } from "./MarginAnalyzer";
import { BalanceSheetAnalyzer } from "./BalanceSheetAnalyzer";
import { CashFlowAnalyzer } from "./CashFlowAnalyzer";

export interface BusinessFundamentalsResult {

  overall: AnalysisResult;

  revenue: AnalysisResult;

  margin: AnalysisResult;

  balanceSheet: AnalysisResult;

  cashFlow: AnalysisResult;

}

export class BusinessFundamentalsEngine {

  analyze(
    statements: FinancialStatement[]
  ): BusinessFundamentalsResult {

    const revenue =
      new RevenueAnalyzer().analyze(statements);

    const margin =
      new MarginAnalyzer().analyze(statements);

    const balanceSheet =
      new BalanceSheetAnalyzer().analyze(statements);

    const cashFlow =
      new CashFlowAnalyzer().analyze(statements);

    const score = Math.round(

      (
        revenue.score +
        margin.score +
        balanceSheet.score +
        cashFlow.score

      ) / 4

    );

    const confidence = Math.round(

      (
        revenue.confidence +
        margin.confidence +
        balanceSheet.confidence +
        cashFlow.confidence

      ) / 4

    );

    const overall: AnalysisResult = {

      score,

      confidence,

      summary:
        "Business fundamentals analyzed successfully.",

      strengths: [

        ...revenue.strengths,
        ...margin.strengths,
        ...balanceSheet.strengths,
        ...cashFlow.strengths

      ],

      weaknesses: [

        ...revenue.weaknesses,
        ...margin.weaknesses,
        ...balanceSheet.weaknesses,
        ...cashFlow.weaknesses

      ],

      evidence: [

        ...revenue.evidence,
        ...margin.evidence,
        ...balanceSheet.evidence,
        ...cashFlow.evidence

      ]

    };

    return {

      overall,

      revenue,

      margin,

      balanceSheet,

      cashFlow

    };

  }

}
