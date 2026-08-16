/**
 * Real provider interfaces -- Phase 1, third piece, of the Data
 * Abstraction layer. Quant should depend on these contracts, not
 * directly on Finnhub/Alpaca/SEC EDGAR/Currents by name -- so
 * swapping a provider later (e.g. replacing today's Currents-based
 * news with a licensed provider once Track B confirms one) doesn't
 * require touching Quant's intelligence logic at all.
 *
 * Real, honest scoping, consistent with round85/86: this defines
 * the contracts only. Existing providers (FinnhubQuoteProvider,
 * AlpacaOptionsProvider, SECEdgarProvider, FinnhubEarningsCalendarProvider,
 * CurrentsAPIProvider) are NOT refactored to formally implement these
 * interfaces in this round -- per the explicit instruction not to
 * prematurely connect anything, this is the contract definition
 * step, not a rewiring step. Each interface's return types are
 * grounded in those real, already-existing provider return shapes
 * (Quote, OptionContract, SECFiling, EarningsCalendarEntry,
 * MarketEvent) rather than inventing parallel types that would drift
 * from what's actually returned today.
 */

import type { Quote } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import type { OptionContract } from "@/engine/trading/providers/AlpacaOptionsProvider";
import type { SECFiling } from "@/engine/evidence/providers/SECEdgarProvider";
import type { EarningsCalendarEntry } from "@/engine/earnings/providers/FinnhubEarningsCalendarProvider";
import type { MarketEvent } from "./MarketEvent";

/** Real-time and recent price/quote data for one ticker. */
export interface MarketDataProvider {
    getQuote(ticker: string): Promise<Quote>;
}

/** Options chain data for one underlying ticker. */
export interface OptionsProvider {
    getOptionChain(underlyingSymbol: string, expirationDate?: string): Promise<OptionContract[]>;
}

/** SEC filing history for one company. */
export interface SECProvider {
    getCIK(ticker: string): Promise<string | null>;
    getFilings(cik: string): Promise<SECFiling[]>;
}

/** Upcoming/historical earnings report data for one ticker. */
export interface EarningsProvider {
    getNext(ticker: string): Promise<EarningsCalendarEntry | null>;
}

/**
 * Real, normalized news/event data for one ticker -- returns
 * MarketEvent[] (round86's schema), not raw provider-specific
 * article objects. Whatever implements this is responsible for
 * normalizing its own provider's real response shape into
 * MarketEvent before returning it, so callers never see
 * provider-specific fields.
 *
 * Every real implementation of this interface MUST set
 * intendedPurpose and sourceId honestly per event, and callers MUST
 * check isDataSourceAuthorized() before using a returned event for
 * an internal-decision purpose -- this interface's return type alone
 * does not enforce that; DataSourceRegistry.ts does.
 */
export interface NewsProvider {
    getRecentEvents(ticker: string): Promise<MarketEvent[]>;
}
