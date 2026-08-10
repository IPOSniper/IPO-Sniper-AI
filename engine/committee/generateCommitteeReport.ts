/**
 * ⚠️ DEAD CODE — NOT wired into any live page as of this comment.
 * The live Committee Panel (components/workstation/panels/CommitteePanel.tsx)
 * reads from research.committee.reports, populated by the REAL
 * engine/committee/analysts/*.ts (SECAnalyst, ValuationAnalyst,
 * RiskAnalyst, NewsAnalyst). This file and everything under
 * engine/analysts/ is a separate, older scaffold: every analyst in
 * that directory returns a hardcoded score/confidence/thesis
 * regardless of the ticker passed in, and companyName below is
 * literally the string "Demo Company" always. Nothing currently
 * calls this — verified via grep, only engine/committee/index.ts and
 * CommitteeService.ts (also unused elsewhere) reference it.
 *
 * Left in place rather than deleted (didn't want to remove code
 * without being asked to), but do NOT wire this into a live page as-is
 * — it would silently show fabricated numbers for every ticker.
 */
import {
  analyzeFinancials,
  analyzeTechnicals,
  analyzeNews,
} from "../analysts";

import { InvestmentCommitteeReport } from "./InvestmentCommitteeReport";

export async function generateCommitteeReport(
  ticker: string
): Promise<InvestmentCommitteeReport> {

  const financial = await analyzeFinancials(ticker);

  const technical = await analyzeTechnicals(ticker);

  const news = await analyzeNews(ticker);

  const conviction = Math.round(
    (
      financial.score +
      technical.score +
      news.score
    ) / 3
  );

  const rating =
    conviction >= 90 ? "Strong Buy" :
    conviction >= 75 ? "Buy" :
    conviction >= 60 ? "Hold" :
    conviction >= 45 ? "Reduce" :
    "Sell";

  return {

    ticker,

    companyName: "Demo Company",

    generatedAt: new Date(),

    conviction,

    rating,

    trend: {
      direction: "Strengthening",
      previousConviction: conviction - 4,
      currentConviction: conviction,
      changeReason:
        "Consensus among analyst engines continues to improve."
    },

    thesis:
      "The investment committee believes the thesis is strengthening based on combined analyst opinions.",

    summary:
      "Three analyst engines currently support a positive outlook.",

    bullishFactors: [
      {
        title: "Financial Strength",
        description: financial.thesis,
        impact: "Bullish",
        confidence: financial.confidence
      },
      {
        title: "Technical Trend",
        description: technical.thesis,
        impact: "Bullish",
        confidence: technical.confidence
      },
      {
        title: "News Sentiment",
        description: news.thesis,
        impact: "Bullish",
        confidence: news.confidence
      }
    ],

    bearishFactors: [],

    evidence: [

      {
        id: "financial",
        category: "Financial",
        title: "Financial Analysis",
        summary: financial.thesis,
        status: "Positive",
        confidence: financial.confidence
      },

      {
        id: "technical",
        category: "Technical",
        title: "Technical Analysis",
        summary: technical.thesis,
        status: "Positive",
        confidence: technical.confidence
      },

      {
        id: "news",
        category: "News",
        title: "News Analysis",
        summary: news.thesis,
        status: "Positive",
        confidence: news.confidence
      }

    ],

    analystOpinions: [

      {
        analyst: "Financial Analyst",
        score: financial.score,
        confidence: financial.confidence,
        thesis: financial.thesis,
        bullishFactors: [],
        bearishFactors: [],
        evidence: []
      },

      {
        analyst: "Technical Analyst",
        score: technical.score,
        confidence: technical.confidence,
        thesis: technical.thesis,
        bullishFactors: [],
        bearishFactors: [],
        evidence: []
      },

      {
        analyst: "News Analyst",
        score: news.score,
        confidence: news.confidence,
        thesis: news.thesis,
        bullishFactors: [],
        bearishFactors: [],
        evidence: []
      }

    ]

  };

}
