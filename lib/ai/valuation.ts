export interface ValuationInput {
  marketCap?: number;
  revenue?: number;
  earnings?: number;
}

export function scoreValuation(
  data?: ValuationInput
) {
  let score = 50;

  const reasons: string[] = [];

  if (!data) {
    return {
      score: 50,
      reasons: ["Valuation data unavailable"],
    };
  }

  //----------------------------------------
  // Price-to-Sales
  //----------------------------------------

  if (data.marketCap && data.revenue) {

    const ps = data.marketCap / data.revenue;

    if (ps < 5) {
      score += 20;
      reasons.push("Very attractive Price-to-Sales ratio");
    }
    else if (ps < 10) {
      score += 10;
      reasons.push("Reasonable Price-to-Sales ratio");
    }
    else if (ps < 20) {
      score += 2;
      reasons.push("Premium valuation");
    }
    else {
      score -= 15;
      reasons.push("Very expensive valuation");
    }
  }

  //----------------------------------------
  // Profitability
  //----------------------------------------

  if (data.earnings !== undefined) {

    if (data.earnings > 0) {
      score += 10;
      reasons.push("Profitable company");
    }
    else {
      score -= 5;
      reasons.push("Currently unprofitable");
    }
  }

  //----------------------------------------

  score = Math.max(0, Math.min(score, 100));

  return {
  score,

  confidence: score >= 80 ? 90 : 80,

  reasons,

  warnings: [],
};
}