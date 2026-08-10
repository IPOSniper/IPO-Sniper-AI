import { analyzeIPO } from "./thesis";
import { scoreFundamentals } from "./fundamentals";
import { scoreFloat } from "./float";
import { scoreValuation } from "./valuation";
import { scoreInsiders } from "./insiders";
import { scoreMacro } from "./macro";
import { buildReport } from "./report";
import { weightedScore } from "./weights";

import type { IPOInput } from "@/engine/types/IPOInput";

export async function buildBrain(ipo: IPOInput) {
  // -----------------------------
  // Primary AI Thesis
  // -----------------------------
  const thesis = analyzeIPO(
    ipo.company,
    ipo.exchange,
    ipo.price,
    ipo.shares ?? 0
  );

  // -----------------------------
  // Specialist Modules
  // -----------------------------
  const fundamentals = scoreFundamentals();
  const float = scoreFloat(ipo.shares ?? 0);
  const valuation = scoreValuation();
  const insiders = scoreInsiders();
  const macro = scoreMacro();

  // -----------------------------
  // Overall Weighted Score
  // -----------------------------
  const overallScore = Math.round(
    weightedScore({
      thesis: thesis.score,
      fundamentals: fundamentals.score,
      valuation: valuation.score,
      float: float.score,
      insiders: insiders.score,
      macro: macro.score,
      risk: 100 - thesis.confidence,
    })
  );

  const finalAnalysis = {
    ...thesis,
    score: overallScore,
  };

  const report = buildReport(finalAnalysis);

  return {
    overallScore,
    report,
    analysis: finalAnalysis,
    modules: {
      fundamentals,
      valuation,
      float,
      insiders,
      macro,
    },
  };
}