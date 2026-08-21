/**
 * Compatibility adapter connecting OpportunityEngine (news + SEC + earnings +
 * price signals) to the existing ticker-based autonomous orchestration, without
 * changing that orchestration's contract. QUANT -- OPPORTUNITY ENGINE
 * INTEGRATION v1, Step 1. Does not touch BatchScanner, risk gates, or execution.
 *
 * providerStatus:
 *   success - no provider failures. An empty candidate set here is a genuine
 *             quiet market, not a failure.
 *   partial - some providers failed but usable candidates remain; legacy
 *             scanner is NOT invoked (buildPriceEvents already folds
 *             scanForOpportunities in as the "price" category, so there is
 *             nothing to deduplicate between the two systems in this state).
 *   failed  - engine threw, or returned zero candidates while providers failed.
 *             Falls back to the legacy OpportunityScanner-derived watchlist.
 */

import { buildOpportunityUniverseWithStatus, type RankedOpportunity, type OpportunitySourceCategory } from "./OpportunityEngine";
import { scanForOpportunities } from "./OpportunityScanner";

export type DiscoverySource = "opportunity_engine" | "legacy_fallback";
export type ProviderStatus = "success" | "partial" | "failed";

export interface AutonomousCandidateSet {
    tickers: string[];
    opportunities: RankedOpportunity[];
    discoverySource: DiscoverySource;
    providerStatus: ProviderStatus;
    failedProviders: OpportunitySourceCategory[];
}

const CATEGORY_PRIORITY: Record<OpportunitySourceCategory, number> = { sec: 25, earnings: 20, news: 15, price: 15 };

/** ticker + primaryCatalyst + eventTimestamp -- stops the same catalyst from being
 * treated as a brand-new opportunity every time it is rediscovered. */
export function opportunityFingerprint(opportunity: RankedOpportunity): string {
    if (opportunity.events.length === 0) return `${opportunity.ticker}|none|none`;
    const primary = opportunity.events.reduce((best, e) =>
        CATEGORY_PRIORITY[e.category] > CATEGORY_PRIORITY[best.category] ? e : best
    );
    return `${opportunity.ticker}|${primary.category}|${primary.timestamp}`;
}

export async function buildAutonomousCandidateSet(
    limit = 12,
    fallbackWatchlist: string[] = ["RIOT", "IREN", "RKLB", "KTOS", "CLSK"]
): Promise<AutonomousCandidateSet> {
    try {
        const { rankedOpportunities, failedProviders } = await buildOpportunityUniverseWithStatus();

        if (failedProviders.length > 0 && rankedOpportunities.length === 0) {
            return buildLegacyFallback(limit, fallbackWatchlist, failedProviders);
        }

        const top = rankedOpportunities.slice(0, limit);
        const status: ProviderStatus = failedProviders.length > 0 ? "partial" : "success";

        return {
            tickers: top.map(o => o.ticker),
            opportunities: top,
            discoverySource: "opportunity_engine",
            providerStatus: status,
            failedProviders,
        };
    } catch {
        return buildLegacyFallback(limit, fallbackWatchlist, ["sec", "news", "earnings", "price"]);
    }
}

async function buildLegacyFallback(
    limit: number,
    fallbackWatchlist: string[],
    failedProviders: OpportunitySourceCategory[]
): Promise<AutonomousCandidateSet> {
    try {
        const candidates = await scanForOpportunities(limit, 20);
        const tickers = candidates.length > 0 ? candidates.map(c => c.ticker) : fallbackWatchlist;
        return { tickers, opportunities: [], discoverySource: "legacy_fallback", providerStatus: "failed", failedProviders };
    } catch {
        return { tickers: fallbackWatchlist, opportunities: [], discoverySource: "legacy_fallback", providerStatus: "failed", failedProviders };
    }
}
