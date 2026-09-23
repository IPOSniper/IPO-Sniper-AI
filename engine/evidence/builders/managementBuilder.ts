import { EvidenceBuilder } from "../types";
import { ManagementEvidence } from "../package";
import { SECForm4Provider } from "../providers/SECForm4Provider";

/**
 * insiderOwnership: computed for real from Form 4 filings already
 * fetched for the Insider Activity panel -- takes each unique
 * insider's MOST RECENT sharesOwnedFollowingTransaction (across the
 * last 10 real Form 4s) and sums them against sharesOutstanding.
 * Honest caveats, reflected in the capped confidence: this only
 * covers insiders who filed a Form 4 within the last 10 filings
 * fetched (a quiet long-term holder who hasn't traded recently is
 * missed), and duplicate/derivative-transaction rows are not
 * de-duplicated beyond "most recent per name."
 *
 * founderLed and executiveTenure have NO real data source (Form 4
 * doesn't report founder status or tenure) and stay honest,
 * zero-confidence stubs -- not guessed, not left silently blocking
 * insiderOwnership from being used (see the ManagementAnalyst.ts
 * fix applied alongside this).
 */
export class ManagementBuilder
  implements EvidenceBuilder<ManagementEvidence> {

  private readonly form4Provider = new SECForm4Provider();

  async build(ticker: string, sharesOutstanding?: number): Promise<ManagementEvidence> {

    const now = new Date();

    const stub = {
      founderLed: {
        value: false,
        source: "INTERNAL" as const,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },
      executiveTenure: {
        value: 0,
        source: "INTERNAL" as const,
        confidence: 0,
        verified: false,
        collectedAt: now,
      },
    };

    if (!sharesOutstanding || sharesOutstanding <= 0) {
      return {
        ...stub,
        insiderOwnership: {
          value: 0, source: "INTERNAL", confidence: 0, verified: false, collectedAt: now,
        },
      };
    }

    try {
      const transactions = await this.form4Provider.getRecentInsiderTransactions(ticker, 10);

      const latestPerInsider = new Map<string, number>();
      for (const t of transactions) {
        if (t.sharesOwnedFollowingTransaction === null) continue;
        // transactions are already sorted most-recent-first by the provider;
        // only keep the first (= most recent) value seen per insider name.
        if (!latestPerInsider.has(t.insiderName)) {
          latestPerInsider.set(t.insiderName, t.sharesOwnedFollowingTransaction);
        }
      }

      if (latestPerInsider.size === 0) {
        return {
          ...stub,
          insiderOwnership: {
            value: 0, source: "INTERNAL", confidence: 0, verified: false, collectedAt: now,
          },
        };
      }

      const totalInsiderShares = [...latestPerInsider.values()].reduce((sum, v) => sum + v, 0);
      const ownershipPct = (totalInsiderShares / sharesOutstanding) * 100;

      return {
        ...stub,
        insiderOwnership: {
          value: ownershipPct,
          source: "SEC",
          // Capped below the debt/liquidity fixes' 70-75: real, but
          // only covers insiders who filed within the last 10 Form 4s.
          confidence: 55,
          verified: true,
          collectedAt: now,
        },
      };

    } catch {
      return {
        ...stub,
        insiderOwnership: {
          value: 0, source: "INTERNAL", confidence: 0, verified: false, collectedAt: now,
        },
      };
    }
  }
}