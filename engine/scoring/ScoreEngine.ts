import { EvidencePackage } from "../evidence/package";

export interface ScoreFactor {
  category: string;
  score: number;
  reason: string;
}

export interface ScoreBreakdown {
  totalScore: number;
  factors: ScoreFactor[];
}

export class ScoreEngine {

  calculate(
    evidence: EvidencePackage
  ): ScoreBreakdown {

    const factors: ScoreFactor[] = [];

    let total = 50;

    // Revenue Growth

    if (evidence.financial.revenueGrowth.value > 20) {

      total += 12;

      factors.push({
        category: "Revenue Growth",
        score: 12,
        reason: "Revenue growth exceeds 20%."
      });

    }

    // Gross Margin

    if (evidence.financial.grossMargin.value > 50) {

      total += 10;

      factors.push({
        category: "Gross Margin",
        score: 10,
        reason: "Gross margins indicate pricing power."
      });

    }

    // Sector Momentum

    if (evidence.market.sectorMomentum.value > 70) {

      total += 8;

      factors.push({
        category: "Sector Momentum",
        score: 8,
        reason: "Sector is outperforming."
      });

    }

    // Low Float

    if (evidence.ipo.floatShares.value < 20000000) {

      total -= 6;

      factors.push({
        category: "Low Float",
        score: -6,
        reason: "Lower float increases volatility."
      });

    }

    // Industry Growth

    if (evidence.industry.industryGrowth.value > 15) {

      total += 7;

      factors.push({
        category: "Industry Growth",
        score: 7,
        reason: "Industry growth supports expansion."
      });

    }

    total = Math.max(0, Math.min(100, total));

    return {

      totalScore: total,

      factors

    };

  }

}