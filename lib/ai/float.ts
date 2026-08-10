export interface FloatInput {
  sharesOutstanding?: number;
  publicFloat?: number;
  insiderOwnership?: number;
}

export function scoreFloat(
  shares?: number,
  data?: FloatInput
) {
  let score = 50;

  const reasons: string[] = [];

  //----------------------------------------
  // Basic Share Count
  //----------------------------------------

  if (shares !== undefined) {

    if (shares < 5_000_000) {
      score += 25;
      reasons.push("Ultra-low float");
    }
    else if (shares < 10_000_000) {
      score += 18;
      reasons.push("Low float");
    }
    else if (shares < 25_000_000) {
      score += 8;
      reasons.push("Moderate float");
    }
    else if (shares > 100_000_000) {
      score -= 15;
      reasons.push("Very large float");
    }
  }

  //----------------------------------------
  // Public Float %
  //----------------------------------------

  if (
    data?.sharesOutstanding &&
    data?.publicFloat
  ) {

    const percent =
      (data.publicFloat / data.sharesOutstanding) * 100;

    if (percent < 15) {
      score += 15;
      reasons.push("Very small public float");
    }
    else if (percent < 30) {
      score += 8;
      reasons.push("Limited public float");
    }
    else if (percent > 60) {
      score -= 10;
      reasons.push("Large public float");
    }
  }

  //----------------------------------------
  // Insider Ownership
  //----------------------------------------

  if (data?.insiderOwnership !== undefined) {

    if (data.insiderOwnership > 70) {
      score += 12;
      reasons.push("Very high insider ownership");
    }
    else if (data.insiderOwnership > 40) {
      score += 6;
      reasons.push("Strong insider ownership");
    }
    else if (data.insiderOwnership < 10) {
      score -= 8;
      reasons.push("Low insider ownership");
    }
  }

  //----------------------------------------

  score = Math.max(0, Math.min(score, 100));

  return {
  score,

  confidence: 90,

  reasons,

  warnings: [],
};
}