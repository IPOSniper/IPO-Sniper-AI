/**
 * Real Event + Price Reaction Engine -- 106A, first version. Given a
 * real ingested event (round91-92's market_events), correlates it
 * with the real price data now available (round106's
 * AlpacaBarsProvider) to answer: did the price actually move around
 * this event?
 *
 * No "use server" here, matching the established convention (this is
 * a plain engine module, not a Next.js Server Action itself) --
 * same fix already caught and applied twice before this session in
 * EventMemory.ts and QuantMemoryEngine.ts.
 *
 * Real, honest scoping: this is a real, simple daily-close
 * comparison (the event's real day close vs. the prior real trading
 * day's close), not the full intraday "10:31 AM event -> 10:32 AM
 * +8.4%" correlation the original Price Intelligence proposal
 * describes. AlpacaBarsProvider does support intraday timeframes
 * (1Hour/15Min/1Min), but building genuine intraday event-to-bar
 * alignment (matching a specific timestamp to the right bar,
 * handling market-closed periods, etc.) is real, separate,
 * meaningfully harder work -- this ships the honest daily version
 * first rather than an imprecise intraday approximation.
 */

import { AlpacaBarsProvider } from "@/engine/evidence/providers/AlpacaBarsProvider";

export interface PriceReaction {
    ticker: string;
    eventDate: string;
    /** Real close price on the real trading day the event occurred (or the next real trading day if the event landed on a non-trading day). Null if no real bar data was found. */
    eventDayClose: number | null;
    /** Real close price on the real prior trading day. Null if no real bar data was found. */
    priorDayClose: number | null;
    /** Real percent change, eventDayClose vs priorDayClose. Null when either real price is unavailable -- never estimated. */
    reactionPercent: number | null;
}

/**
 * Real price reaction for one ticker around one real event date.
 * Fetches real daily bars covering the event date and finds the
 * real close on that day (or the nearest real following trading
 * day) and the real prior trading day's close.
 */
export async function getPriceReaction(ticker: string, eventOccurredAt: string): Promise<PriceReaction> {
    const eventDate = eventOccurredAt.slice(0, 10);
    const base = { ticker: ticker.trim().toUpperCase(), eventDate, eventDayClose: null, priorDayClose: null, reactionPercent: null };

    try {
        // Real, generous window -- enough real trading days on both
        // sides of the event to reliably find a real bar for the
        // event date and the real prior trading day, even across
        // weekends/holidays.
        const bars = await new AlpacaBarsProvider().getBars(ticker, "1Day", 400);
        if (bars.length === 0) return base;

        const sorted = [...bars].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const eventIndex = sorted.findIndex(bar => bar.timestamp.slice(0, 10) >= eventDate);

        if (eventIndex === -1 || eventIndex === 0) return base;

        const eventDayClose = sorted[eventIndex].close;
        const priorDayClose = sorted[eventIndex - 1].close;
        const reactionPercent = priorDayClose !== 0 ? ((eventDayClose - priorDayClose) / priorDayClose) * 100 : null;

        return { ...base, eventDayClose, priorDayClose, reactionPercent };
    } catch (err) {
        console.error(`getPriceReaction failed for ${ticker}:`, err instanceof Error ? err.message : err);
        return base;
    }
}
