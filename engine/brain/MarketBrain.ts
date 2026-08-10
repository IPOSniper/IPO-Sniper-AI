import { EvidencePackage } from "../evidence/package";

export interface MarketInsight {
  summary: string;
  confidence: number;
  drivers: string[];
  risks: string[];
  action: string;
}

export class MarketBrain {
  analyze(
    evidence: EvidencePackage
  ): MarketInsight {

    const drivers: string[] = [];
    const risks: string[] = [];

    if (evidence.financial.revenueGrowth.value > 20) {
      drivers.push(
        "Revenue growth is accelerating."
      );
    }

    if (evidence.market.sectorMomentum.value > 70) {
      drivers.push(
        "Sector momentum is strong."
      );
    }

    if (evidence.ipo.floatShares.value < 20000000) {
      risks.push(
        "Low float may increase volatility."
      );
    }

    return {
      summary:
        "Overall fundamentals remain constructive.",

      confidence: 88,

      drivers,

      risks,

      action:
        "Continue monitoring earnings and institutional activity.",
    };
  }
}