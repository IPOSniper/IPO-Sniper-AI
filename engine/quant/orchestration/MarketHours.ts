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
