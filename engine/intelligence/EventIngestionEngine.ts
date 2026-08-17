/**
 * Real Event Ingestion Engine -- Phase 2 (Event Intelligence), third
 * piece, completing Round 2 as far as it can go without Track B (a
 * licensed news provider isn't connected, so this only has one real
 * source to ingest from right now: SEC EDGAR).
 *
 * This is the first place the real Provider -> Normalize -> Event
 * Schema pipeline actually becomes CALLABLE end to end -- round89's
 * normalizeSecFilingToEvent() was a real, working function, but
 * nothing in the app called it yet. This engine is that caller.
 *
 * Real, honest scoping: single-source (SEC only), no caching/dedup,
 * no persistence -- returns a fresh in-memory MarketEvent[] each
 * call. A general, multi-source coordinator that also ingests from
 * licensed news is real, later work that depends on Track B.
 */

import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";
import { normalizeSecFilingToEvent } from "./SecFilingEventNormalizer";
import type { MarketEvent } from "@/engine/data-sources/MarketEvent";

/**
 * Real, live ingestion for one ticker -- fetches this company's
 * actual recent SEC filings and normalizes each into a real
 * MarketEvent. Returns an empty array (not a fabricated event) when
 * no real CIK/filings are found, consistent with this app's
 * established "honest empty state over guessed data" pattern.
 */
export async function ingestRecentEvents(ticker: string, limit = 10): Promise<MarketEvent[]> {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) return [];

    try {
        const provider = new SECEdgarProvider();
        const cik = await provider.getCIK(normalizedTicker);
        if (!cik) return [];

        const filings = await provider.getFilings(cik);
        return filings
            .slice(0, limit)
            .map(filing => normalizeSecFilingToEvent(filing, normalizedTicker));
    } catch {
        // Real ingestion can fail independently (SEC API down, rate
        // limited, etc.) -- an empty result is the honest outcome,
        // not a fabricated event list.
        return [];
    }
}
