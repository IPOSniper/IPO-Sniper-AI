import { EvidenceBuilder } from "../types";
import { AnalystConsensusEvidence } from "../package";
import { FinnhubQuoteProvider } from "../providers/FinnhubQuoteProvider";

/**
 * Real sell-side analyst recommendation counts + consensus price
 * target, both from Finnhub's real, documented, free-tier endpoints.
 * Fails closed to honest zero-confidence stubs, same convention as
 * every other builder here -- never fabricates a recommendation or
 * target when the real data isn't available.
 */
export class AnalystConsensusBuilder
  implements EvidenceBuilder<AnalystConsensusEvidence> {

  private readonly provider = new FinnhubQuoteProvider();

  async build(ticker: string): Promise<AnalystConsensusEvidence> {
    const now = new Date();
    const source = "FINNHUB" as const;
    const stub = (value: number) => ({ value, source, confidence: 0, verified: false, collectedAt: now });

    try {
      const [trends, target] = await Promise.all([
        this.provider.getRecommendationTrends(ticker),
        this.provider.getPriceTarget(ticker),
      ]);

      const trendField = (value: number | undefined) =>
        trends ? { value: value ?? 0, source, confidence: 90, verified: true, collectedAt: now } : stub(0);

      const targetField = (value: number | undefined) =>
        target ? { value: value ?? 0, source, confidence: 85, verified: true, collectedAt: now } : stub(0);

      return {
        strongBuy: trendField(trends?.strongBuy),
        buy: trendField(trends?.buy),
        hold: trendField(trends?.hold),
        sell: trendField(trends?.sell),
        strongSell: trendField(trends?.strongSell),
        priceTargetHigh: targetField(target?.high),
        priceTargetLow: targetField(target?.low),
        priceTargetMean: targetField(target?.mean),
        priceTargetMedian: targetField(target?.median),
      };
    } catch {
      return {
        strongBuy: stub(0), buy: stub(0), hold: stub(0), sell: stub(0), strongSell: stub(0),
        priceTargetHigh: stub(0), priceTargetLow: stub(0), priceTargetMean: stub(0), priceTargetMedian: stub(0),
      };
    }
  }
}