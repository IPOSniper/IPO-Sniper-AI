/**
 * Real Event + Price Structure Context -- Round 112, first version.
 * Connects round109's EventPriceReaction with round111's
 * PriceStructureEngine into one real, combined object for Quant to
 * reason over.
 *
 * Real, honest scoping stated directly: this does NOT compute a
 * "sentiment vs. reaction divergence" score, despite that being the
 * example in the Round 112 request. MarketEvent (round86) has a real
 * materiality field, but genuinely no bullish/bearish sentiment
 * DIRECTION field -- computing a real divergence needs a real
 * "was this event actually bullish or bearish" signal to compare the
 * real price reaction against, which doesn't exist yet. Fabricating
 * one here would mean inventing a signal this app doesn't actually
 * have, not a real computation. This ships the two real, already-
 * built pieces (price reaction, price structure) combined into one
 * object; a real sentiment-direction field on MarketEvent, and the
 * genuine divergence check built on top of it, is real, separate,
 * later work.
 */

import { getPriceReaction, type PriceReaction } from "./EventPriceReaction";
import { computePriceStructure, type PriceStructure } from "./PriceStructureEngine";
import type { MaterialityLevel } from "@/engine/data-sources/MarketEvent";

export interface EventPriceContext {
    ticker: string;
    eventId: string;
    materiality: MaterialityLevel;
    headline: string;
    /** Real, event-day-vs-prior-day price reaction (round109). */
    priceReaction: PriceReaction;
    /** Real, current price structure computed from real bars (round111) -- reflects structure as of now, not necessarily "at the moment of the event," since intraday event-to-bar alignment isn't built yet (see EventPriceReaction's own docstring). */
    currentStructure: PriceStructure | null;
}

/**
 * Real, combined context for one real event -- its real price
 * reaction and the real current price structure for that ticker.
 * Both real, independently-computed pieces; this function does not
 * add any new inference on top of them.
 */
export async function getEventPriceContext(
    ticker: string,
    eventId: string,
    materiality: MaterialityLevel,
    headline: string,
    eventOccurredAt: string
): Promise<EventPriceContext> {
    const normalizedTicker = ticker.trim().toUpperCase();

    const [priceReaction, currentStructure] = await Promise.all([
        getPriceReaction(normalizedTicker, eventOccurredAt),
        computePriceStructure(normalizedTicker),
    ]);

    return { ticker: normalizedTicker, eventId, materiality, headline, priceReaction, currentStructure };
}
