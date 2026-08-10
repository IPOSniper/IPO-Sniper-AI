import { EvidenceBuilder } from "../types";
import { ManagementEvidence } from "../package";

/**
 * NOT REAL DATA — every field below is a placeholder constant,
 * identical for every ticker. Previously this was wrapped with
 * confidence: 100, verified: true, which actively lied about these
 * numbers being real. Fixed to honestly report confidence: 0,
 * verified: false so nothing downstream (analysts, VerificationAnalyst,
 * the UI) mistakes it for real evidence.
 *
 * To make this real: needs a provider for founder/insider-ownership
 * data. Finnhub's /stock/insider-transactions and /stock/ownership
 * endpoints are candidates, but insiderOwnership and executiveTenure
 * specifically likely need aggregation logic on top of raw filings,
 * not a single field lookup. founderLed has no clean data-provider
 * answer at all — that's closer to a research/classification task.
 */
export class ManagementBuilder
  implements EvidenceBuilder<ManagementEvidence> {

  async build(): Promise<ManagementEvidence> {

    const now = new Date();

    return {
      founderLed: {
        value: false,
        source: "INTERNAL",
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      insiderOwnership: {
        value: 0,
        source: "INTERNAL",
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      executiveTenure: {
        value: 0,
        source: "INTERNAL",
        confidence: 0,
        verified: false,
        collectedAt: now,
      },
    };
  }
}
