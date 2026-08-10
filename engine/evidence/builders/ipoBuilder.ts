import { EvidenceBuilder } from "../types";
import { IPOEvidence } from "../package";
import { FinnhubIPOProvider } from "../providers/FinnhubIPOProvider";

export class IPOBuilder
  implements EvidenceBuilder<IPOEvidence>
{
  private readonly provider = new FinnhubIPOProvider();

  async build(ticker: string): Promise<IPOEvidence> {
    const now = new Date();
    const source = "FINNHUB" as const;

    try {
      const entry = await this.provider.getIPO(ticker);

      if (!entry) {
        throw new Error(`No Finnhub IPO calendar entry found for ${ticker}.`);
      }

      // Finnhub returns price as a string, sometimes a range like
      // "18.00-20.00" for a not-yet-priced IPO. Taking the low end
      // when it's a range — an honest approximation, not the final
      // price, which callers should treat that way via the field's
      // confidence.
      const priceValue = parseFloat(entry.price?.split("-")[0] ?? "0");
      const isRange = entry.price?.includes("-") ?? false;

      return {
        floatShares: {
          value: entry.numberOfShares ?? 0,
          source,
          confidence: entry.numberOfShares ? 85 : 0,
          verified: Boolean(entry.numberOfShares),
          collectedAt: now,
        },

        ipoPrice: {
          value: priceValue,
          source,
          // Lower confidence when it's a range (not yet priced) vs
          // a single confirmed price.
          confidence: priceValue > 0 ? (isRange ? 50 : 90) : 0,
          verified: priceValue > 0 && !isRange,
          collectedAt: now,
        },

        ipoDate: {
          value: entry.date ?? null,
          source,
          confidence: entry.date ? 90 : 0,
          verified: Boolean(entry.date),
          collectedAt: now,
        },

        // Underwriters are NOT in Finnhub's IPO calendar. Real data
        // for this now lives in EvidencePackage.sec.underwriters
        // (see engine/evidence/builders/secBuilder.ts), extracted
        // from the actual prospectus. Left honestly unverified here
        // rather than duplicated, to avoid two builders disagreeing
        // on the same fact from two different extraction methods.
        underwriters: {
          value: [],
          source,
          confidence: 0,
          verified: false,
          collectedAt: now,
        },
      };

    } catch {
      return {
        floatShares: { value: 0, source, confidence: 0, verified: false, collectedAt: now },
        ipoPrice: { value: 0, source, confidence: 0, verified: false, collectedAt: now },
        ipoDate: { value: null, source, confidence: 0, verified: false, collectedAt: now },
        underwriters: { value: [], source, confidence: 0, verified: false, collectedAt: now },
      };
    }
  }
}
