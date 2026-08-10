import { EvidenceBuilder } from "../types";
import { IndustryEvidence } from "../package";

/**
 * NOT REAL DATA — placeholder constants, identical for every ticker,
 * previously mislabeled confidence: 100, verified: true. Fixed to
 * honestly report confidence: 0, verified: false.
 *
 * To make this real: TAM has no reliable API source — it's typically
 * sourced from research reports (Gartner, IDC) or the company's own
 * S-1 market-sizing claims, which need a human/LLM extraction step,
 * not a data-provider field. industryGrowth could be approximated
 * from sector ETF performance or BLS/industry data as a proxy.
 */
export class IndustryBuilder
  implements EvidenceBuilder<IndustryEvidence>
{
  async build(): Promise<IndustryEvidence> {
    const now = new Date();

    return {
      tam: {
        value: 0,
        source: "INTERNAL",
        confidence: 0,
        verified: false,
        collectedAt: now,
      },

      industryGrowth: {
        value: 0,
        source: "INTERNAL",
        confidence: 0,
        verified: false,
        collectedAt: now,
      },
    };
  }
}
