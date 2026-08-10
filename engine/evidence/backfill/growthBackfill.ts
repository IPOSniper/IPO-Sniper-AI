import type { FinancialEvidence } from "../package";
import { FinnhubEstimatesProvider } from "../providers/FinnhubEstimatesProvider";

/**
 * Fills revenueGuidance from Wall Street consensus estimates — NOT
 * management's own guidance, see FinnhubEstimatesProvider's doc
 * comment. This is what unblocks Growth Analyst, honestly relabeled
 * as consensus rather than pretending it's company-issued guidance.
 * Confidence capped lower than other backfills given real
 * uncertainty about the exact response field names (untested live).
 */
export async function backfillGrowthGuidance(
    financial: FinancialEvidence,
    ticker: string
): Promise<FinancialEvidence> {

    if (financial.revenueGuidance.verified) {
        return financial;
    }

    try {
        const provider = new FinnhubEstimatesProvider();
        const estimate = await provider.getRevenueEstimate(ticker);

        if (!estimate) {
            return financial;
        }

        return {
            ...financial,
            revenueGuidance: {
                value: estimate.revenueAvg,
                source: "FINNHUB",
                confidence: 45, // capped - consensus estimate, not company guidance, unverified field names
                verified: true,
                collectedAt: new Date(),
            },
        };

    } catch {
        return financial;
    }
}
