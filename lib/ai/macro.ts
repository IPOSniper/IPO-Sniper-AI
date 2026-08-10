export interface MacroInput {
  sector?: string;
  interestRatesHigh?: boolean;
  aiBoom?: boolean;
  recessionRisk?: boolean;
  inflationCooling?: boolean;
  governmentSupport?: boolean;
}

export function scoreMacro(
  data?: MacroInput
) {
  let score = 50;

  const reasons: string[] = [];

  //----------------------------------------
  // AI Boom
  //----------------------------------------

  if (data?.aiBoom) {
    score += 15;
    reasons.push("AI investment cycle remains strong");
  }

  //----------------------------------------
  // Government Support
  //----------------------------------------

  if (data?.governmentSupport) {
    score += 10;
    reasons.push("Government policy supports the industry");
  }

  //----------------------------------------
  // Interest Rates
  //----------------------------------------

  if (data?.interestRatesHigh) {
    score -= 10;
    reasons.push("High interest rates pressure growth stocks");
  } else if (data?.interestRatesHigh === false) {
    score += 5;
    reasons.push("Lower interest rates support growth stocks");
  }

  //----------------------------------------
  // Inflation
  //----------------------------------------

  if (data?.inflationCooling) {
    score += 5;
    reasons.push("Cooling inflation improves market sentiment");
  }

  //----------------------------------------
  // Recession
  //----------------------------------------

  if (data?.recessionRisk) {
    score -= 12;
    reasons.push("Elevated recession risk");
  }

  //----------------------------------------
  // Sector Tailwinds
  //----------------------------------------

  if (data?.sector) {

    switch (data.sector.toLowerCase()) {

      case "artificial intelligence":
      case "ai":
        score += 12;
        reasons.push("Strong AI sector tailwinds");
        break;

      case "semiconductors":
        score += 10;
        reasons.push("Semiconductor demand remains healthy");
        break;

      case "robotics":
        score += 10;
        reasons.push("Automation spending continues to grow");
        break;

      case "cybersecurity":
        score += 10;
        reasons.push("Cybersecurity demand remains resilient");
        break;

      case "space":
        score += 8;
        reasons.push("Growing commercial space industry");
        break;

      case "nuclear":
      case "energy":
        score += 12;
        reasons.push("Energy demand continues to expand");
        break;

      case "defense":
        score += 12;
        reasons.push("Strong global defense spending");
        break;

      case "biotech":
        score += 4;
        reasons.push("Mixed biotech environment");
        break;

      case "consumer":
        score -= 5;
        reasons.push("Consumer sector facing headwinds");
        break;
    }

  }

  //----------------------------------------

  score = Math.max(0, Math.min(score, 100));

  return {
  score,

  confidence: 80,

  reasons,

  warnings: [],
};
}