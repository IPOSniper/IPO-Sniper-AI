import { EvidenceBuilder } from "../types";
import { MarketEvidence } from "../package";

/**
 * NOT REAL DATA — placeholder constants, identical for every ticker,
 * previously mislabeled confidence: 100, verified: true. Fixed to
 * honestly report confidence: 0, verified: false.
 *
 * To make this real: volatilityIndex could come from a real VIX/
 * implied-vol feed (e.g. Polygon options data) or a per-ticker
 * historical-volatility calculation from price history (Finnhub
 * /stock/candle). sectorMomentum needs a defined sector index and a
 * lookback window — a real calculation, not a single field.
 */
export class MarketBuilder
  implements EvidenceBuilder<MarketEvidence>
{
  async build(): Promise<MarketEvidence> {
    const now = new Date();

    return {
      volatilityIndex: {
        value: 0,
        source: "INTERNAL",
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      sectorMomentum: {
        value: 0,
        source: "INTERNAL",
        confidence: 0,
        verified: false,
        collectedAt: now,
      },
    };
  }
}
