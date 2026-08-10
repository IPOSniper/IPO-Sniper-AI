export interface InsiderInput {
  insiderOwnership?: number;
  insiderSelling?: number;
  founderLed?: boolean;
  institutionalOwnership?: number;
  lockupDays?: number;
}

export function scoreInsiders(
  data?: InsiderInput
) {
  let score = 50;

  const reasons: string[] = [];

  //----------------------------------------
  // Insider Ownership
  //----------------------------------------

  if (data?.insiderOwnership !== undefined) {

    if (data.insiderOwnership >= 70) {
      score += 20;
      reasons.push("Exceptional insider ownership");
    }
    else if (data.insiderOwnership >= 50) {
      score += 15;
      reasons.push("High insider ownership");
    }
    else if (data.insiderOwnership >= 25) {
      score += 8;
      reasons.push("Healthy insider ownership");
    }
    else if (data.insiderOwnership < 10) {
      score -= 12;
      reasons.push("Low insider ownership");
    }
  }

  //----------------------------------------
  // Founder Led
  //----------------------------------------

  if (data?.founderLed === true) {
    score += 10;
    reasons.push("Founder-led company");
  }

  //----------------------------------------
  // Insider Selling
  //----------------------------------------

  if (data?.insiderSelling !== undefined) {

    if (data.insiderSelling > 20) {
      score -= 15;
      reasons.push("Heavy insider selling");
    }
    else if (data.insiderSelling > 5) {
      score -= 8;
      reasons.push("Moderate insider selling");
    }
    else {
      score += 5;
      reasons.push("Minimal insider selling");
    }
  }

  //----------------------------------------
  // Institutional Ownership
  //----------------------------------------

  if (data?.institutionalOwnership !== undefined) {

    if (data.institutionalOwnership > 60) {
      score += 12;
      reasons.push("Strong institutional participation");
    }
    else if (data.institutionalOwnership > 30) {
      score += 6;
      reasons.push("Healthy institutional ownership");
    }
  }

  //----------------------------------------
  // Lock-up Period
  //----------------------------------------

  if (data?.lockupDays !== undefined) {

    if (data.lockupDays >= 180) {
      score += 5;
      reasons.push("Standard 180-day lock-up");
    }
    else if (data.lockupDays < 90) {
      score -= 10;
      reasons.push("Short insider lock-up");
    }
  }

  //----------------------------------------

  score = Math.max(0, Math.min(score, 100));

  return {
  score,

  confidence: 88,

  reasons,

  warnings: [],
};
}