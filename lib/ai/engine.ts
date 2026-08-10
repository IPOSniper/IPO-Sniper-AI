import { analyzeIPO } from "./thesis";

import { scoreFundamentals } from "./fundamentals";
import { scoreValuation } from "./valuation";
import { scoreFloat } from "./float";
import { scoreInsiders } from "./insiders";
import { scoreMacro } from "./macro";

import { weightedScore } from "./weights";

import {
  calculateStars,
  calculateGrade,
  calculateConviction,
  calculateConfidence,
} from "./scoring";

import type { IPOInput } from "@/engine/types/IPOInput";

export function runAI(ipo: IPOInput) {
  //----------------------------------
  // Primary Thesis
  //----------------------------------

  const thesis = analyzeIPO(
  ipo.company,
  ipo.exchange,
  ipo.price,
  ipo.shares ?? 0
);

  //----------------------------------
  // Specialist AI
  //----------------------------------

  const fundamentals = scoreFundamentals();

  const valuation = scoreValuation();

  const float = scoreFloat(ipo.shares ?? 0);

  const insiders = scoreInsiders();

  const macro = scoreMacro();

  //----------------------------------
  // Master Score
  //----------------------------------

  const score = weightedScore({

    thesis: thesis.score,

    fundamentals: fundamentals.score,

    valuation: valuation.score,

    float: float.score,

    insiders: insiders.score,

    macro: macro.score,

    risk: 100 - thesis.confidence,

  });

  //----------------------------------
  // Final AI
  //----------------------------------

  return {

    ...thesis,

    score,

    stars: calculateStars(score),

    grade: calculateGrade(score),

    conviction: calculateConviction(score),

    confidence: calculateConfidence(score),

    modules: {

      fundamentals,

      valuation,

      float,

      insiders,

      macro,

    }

  };

}