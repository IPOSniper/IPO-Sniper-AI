/**
 * Real, simple market-hours check -- built for Round 115's cron
 * route, since the scheduler should not attempt real cycles when
 * the market is genuinely closed (Alpaca would reject most real
 * orders anyway, and running RiskEngine/committee analysis
 * repeatedly outside real trading hours wastes real provider rate
 * limits for no benefit).
 *
 * Real, honest limitation stated directly: this checks real NYSE/
 * NASDAQ standard hours (9:30 AM - 4:00 PM ET, Monday-Friday) using
 * real timezone-aware date math, but does NOT account for real
 * market holidays (Thanksgiving, Christmas, etc.) or early-close
 * days -- a full, accurate holiday calendar is real, separate,
 * additional work. This is a real, useful first filter (correctly
 * skips every weekend and every night), not a complete one.
 *
 * Separately, unrelated finding worth noting: the "Market Open"
 * badge shown in Header.tsx is a hardcoded static label, not
 * computed from anything real -- this function is not related to
 * that badge and doesn't fix it.
 */

const MARKET_TIMEZONE = "America/New_York";

export function isMarketOpen(now: Date = new Date()): boolean {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: MARKET_TIMEZONE,
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    }).formatToParts(now);

    const weekday = parts.find(p => p.type === "weekday")?.value;
    const hour = Number(parts.find(p => p.type === "hour")?.value);
    const minute = Number(parts.find(p => p.type === "minute")?.value);

    if (weekday === "Sat" || weekday === "Sun") return false;

    const minutesSinceMidnight = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30;  // 9:30 AM ET
    const marketClose = 16 * 60;     // 4:00 PM ET

    return minutesSinceMidnight >= marketOpen && minutesSinceMidnight < marketClose;
}

// --- Session-aware classification (Session-Aware Multi-Asset Execution Bootstrap, Phase 1) ---
// isMarketOpen() above is UNCHANGED and still used wherever regular-hours-only
// behavior is intended (e.g. quant-harness cron's discovery gate). This is
// additive: a richer session model for callers that need to know WHICH
// non-regular session it is, not just open/closed.
//
// Honest limitation carried over from isMarketOpen(): still does not account
// for market holidays or early-close days.

export type MarketSession = "WEEKEND" | "OVERNIGHT" | "PRE_MARKET" | "REGULAR" | "AFTER_HOURS";

export interface SessionCapabilities {
    session: MarketSession;
    discoveryAllowed: boolean;
    analysisAllowed: boolean;
    /** Whether a stock order COULD be eligible for execution in this session,
     * pending the per-asset overnight_tradable/eligibility check (Phase 2) --
     * this is the session-level gate only, not the final answer for one symbol. */
    stockExecutionAllowed: boolean;
    /** Alpaca's options API does not support extended hours at all -- this is
     * always false outside REGULAR, with no per-asset exception possible. */
    optionsExecutionAllowed: boolean;
}

/**
 * Session boundaries per Alpaca's documented 24/5 equity trading hours
 * (verified against Alpaca's current Trading API docs):
 *   Overnight:    8:00 PM ET (prev day) - 4:00 AM ET
 *   Pre-market:   4:00 AM ET - 9:30 AM ET
 *   Regular:      9:30 AM ET - 4:00 PM ET
 *   After-hours:  4:00 PM ET - 8:00 PM ET
 *   Weekend:      Friday 8:00 PM ET - Sunday 8:00 PM ET (no equity session at all)
 */
export function getMarketSession(now: Date = new Date()): MarketSession {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: MARKET_TIMEZONE,
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    }).formatToParts(now);

    const weekday = parts.find(p => p.type === "weekday")?.value;
    const hour = Number(parts.find(p => p.type === "hour")?.value);
    const minute = Number(parts.find(p => p.type === "minute")?.value);
    const minutesSinceMidnight = hour * 60 + minute;

    const overnightEnd = 4 * 60;        // 4:00 AM
    const preMarketEnd = 9 * 60 + 30;   // 9:30 AM
    const regularEnd = 16 * 60;         // 4:00 PM
    const afterHoursEnd = 20 * 60;      // 8:00 PM

    // Alpaca's 24/5 window: Sunday 8PM ET through Friday 8PM ET. Saturday is
    // always WEEKEND. Sunday before 8PM is WEEKEND; Sunday 8PM+ is OVERNIGHT
    // (the start of the week's trading). Friday 8PM+ is WEEKEND.
    if (weekday === "Sat") return "WEEKEND";
    if (weekday === "Sun" && minutesSinceMidnight < afterHoursEnd) return "WEEKEND";
    if (weekday === "Fri" && minutesSinceMidnight >= afterHoursEnd) return "WEEKEND";

    if (minutesSinceMidnight < overnightEnd) return "OVERNIGHT";
    if (minutesSinceMidnight < preMarketEnd) return "PRE_MARKET";
    if (minutesSinceMidnight < regularEnd) return "REGULAR";
    if (minutesSinceMidnight < afterHoursEnd) return "AFTER_HOURS";
    return "OVERNIGHT"; // Sun 8PM+ through end of day before Mon 4AM
}

export function getSessionCapabilities(now: Date = new Date()): SessionCapabilities {
    const session = getMarketSession(now);

    if (session === "WEEKEND") {
        return { session, discoveryAllowed: true, analysisAllowed: true, stockExecutionAllowed: false, optionsExecutionAllowed: false };
    }
    if (session === "REGULAR") {
        return { session, discoveryAllowed: true, analysisAllowed: true, stockExecutionAllowed: true, optionsExecutionAllowed: true };
    }
    // PRE_MARKET / AFTER_HOURS / OVERNIGHT: stock execution session-level-eligible
    // (Phase 2 asset-level check still required), options never eligible.
    return { session, discoveryAllowed: true, analysisAllowed: true, stockExecutionAllowed: true, optionsExecutionAllowed: false };
}
