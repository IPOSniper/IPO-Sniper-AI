import type {
  AIAnalysis,
  Recommendation,
  Grade,
  RiskLevel,
} from "./types";

export function analyzeIPO(
  company: string,
  exchange: string | null,
  price: string,
  shares: number
): AIAnalysis {

  let score = 50;

  const reasons: string[] = [];
  const bullCase: string[] = [];
  const bearCase: string[] = [];
  const catalysts: string[] = [];
  const warnings: string[] = [];

  //--------------------------------------------------
  // Sector Analysis
  //--------------------------------------------------

  const name = company.toLowerCase();

  if (name.includes("ai")) {
    score += 18;
    reasons.push("Artificial Intelligence");
    bullCase.push("Strong exposure to AI infrastructure");
    catalysts.push("Growing enterprise AI spending");
  }

  if (name.includes("nuclear")) {
    score += 20;
    reasons.push("Nuclear Energy");
    bullCase.push("Benefits from AI power demand");
    catalysts.push("Expansion of nuclear generation");
  }

  if (name.includes("quantum")) {
    score += 18;
    reasons.push("Quantum Computing");
    bullCase.push("Exposure to emerging technology");
    catalysts.push("Commercial adoption");
  }

  if (name.includes("robot")) {
    score += 12;
    reasons.push("Robotics");
    bullCase.push("Automation trend");
  }

  if (name.includes("space")) {
    score += 15;
    reasons.push("Space Economy");
    bullCase.push("Long-term aerospace growth");
  }

  //--------------------------------------------------
  // Exchange
  //--------------------------------------------------

  if (exchange?.includes("NASDAQ")) {
    score += 5;
    bullCase.push("NASDAQ listing");
  }

  //--------------------------------------------------
  // Float
  //--------------------------------------------------

  if (shares > 0 && shares < 10_000_000) {
    score += 10;
    reasons.push("Low Float");
    bullCase.push("Low float could increase demand");
    catalysts.push("Potential post-IPO squeeze");
  } else {
    bearCase.push("Large float");
    warnings.push("Higher share supply");
  }

  //--------------------------------------------------
  // IPO Pricing
  //--------------------------------------------------

  if (price === "TBD") {
    warnings.push("IPO price not finalized");
  }

  //--------------------------------------------------

  score = Math.max(20, Math.min(score, 99));

  //--------------------------------------------------
  // Recommendation
  //--------------------------------------------------

  let recommendation: Recommendation;

  if (score >= 90)
    recommendation = "Strong Buy";
  else if (score >= 80)
    recommendation = "Buy";
  else if (score >= 70)
    recommendation = "Watch";
  else if (score >= 60)
    recommendation = "Hold";
  else
    recommendation = "Avoid";

  //--------------------------------------------------
  // Grade
  //--------------------------------------------------

  let grade: Grade;

  if (score >= 95)
    grade = "A+";
  else if (score >= 90)
    grade = "A";
  else if (score >= 80)
    grade = "B+";
  else if (score >= 70)
    grade = "B";
  else if (score >= 60)
    grade = "C";
  else
    grade = "D";

  //--------------------------------------------------
  // Risk
  //--------------------------------------------------

  let risk: RiskLevel;

  if (score >= 90)
    risk = "Low";
  else if (score >= 75)
    risk = "Medium";
  else
    risk = "High";

  //--------------------------------------------------

  const confidence = Math.min(score + 2, 99);

  const conviction = Math.min(score + 5, 99);

  const stars =
    score >= 95 ? 5 :
    score >= 85 ? 4 :
    score >= 75 ? 3 :
    score >= 65 ? 2 : 1;

  const expectedReturn =
    score >= 90
      ? "+20% to +35%"
      : score >= 80
      ? "+10% to +20%"
      : score >= 70
      ? "+5% to +10%"
      : "Unknown";

  const summary =
    `${company} received an AI score of ${score}. ` +
    `The analysis considers sector, exchange, IPO structure, and float characteristics.`;

  return {
    score,
    conviction,
    confidence,
    stars,
    grade,
    recommendation,
    expectedReturn,
    risk,
    summary,
    bullCase,
    bearCase,
    catalysts,
    warnings,
    reasons,
  };
}