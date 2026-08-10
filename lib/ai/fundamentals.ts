export interface FundamentalInput {
  revenueGrowth?: number;
  grossMargin?: number;
  operatingMargin?: number;
  profitable?: boolean;
  debtToEquity?: number;
}

export function scoreFundamentals(
  data?: FundamentalInput
) {
  let score = 50;

  const reasons: string[] = [];

  if (!data) {
    return {
      score: 50,
      reasons: ["Financial statements unavailable"],
    };
  }

  //----------------------------------------
  // Revenue Growth
  //----------------------------------------

  if (data.revenueGrowth !== undefined) {
    if (data.revenueGrowth > 40) {
      score += 20;
      reasons.push("Exceptional revenue growth");
    } else if (data.revenueGrowth > 20) {
      score += 12;
      reasons.push("Strong revenue growth");
    } else if (data.revenueGrowth > 10) {
      score += 6;
      reasons.push("Positive revenue growth");
    }
  }

  //----------------------------------------
  // Gross Margin
  //----------------------------------------

  if (data.grossMargin !== undefined) {
    if (data.grossMargin > 60) {
      score += 12;
      reasons.push("Excellent gross margins");
    } else if (data.grossMargin > 40) {
      score += 6;
      reasons.push("Healthy gross margins");
    }
  }

  //----------------------------------------
  // Operating Margin
  //----------------------------------------

  if (data.operatingMargin !== undefined) {
    if (data.operatingMargin > 20) {
      score += 10;
      reasons.push("Strong operating margins");
    } else if (data.operatingMargin < 0) {
      score -= 8;
      reasons.push("Operating losses");
    }
  }

  //----------------------------------------
  // Profitability
  //----------------------------------------

  if (data.profitable === true) {
    score += 10;
    reasons.push("Profitable business");
  }

  //----------------------------------------
  // Debt
  //----------------------------------------

  if (data.debtToEquity !== undefined) {
    if (data.debtToEquity < 0.5) {
      score += 8;
      reasons.push("Low debt");
    } else if (data.debtToEquity > 2) {
      score -= 10;
      reasons.push("High leverage");
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
  score,

  confidence: score >= 80 ? 95 : 85,

  reasons,

  warnings: [],
};
}