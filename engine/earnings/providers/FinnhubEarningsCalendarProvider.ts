import { finnhubFetch } from "../../../lib/data/finnhub";

/**
 * Covers the gap FinnhubEarningsProvider doesn't: SCHEDULED (not yet
 * reported) earnings. Finnhub's /calendar/earnings endpoint returns
 * confirmed report dates, session (before/after market), and
 * consensus EPS/revenue estimates for a date range, optionally
 * filtered to one symbol.
 *
 * Every field here is real, sourced data — no invented numbers. If
 * Finnhub hasn't confirmed a date yet, or estimates aren't covered,
 * those fields come back null rather than guessed.
 */

export interface EarningsCalendarEntry {
    symbol: string;
    reportDate: string; // YYYY-MM-DD, as given by Finnhub
    session: "bmo" | "amc" | "dmh" | "unknown"; // before/after market, during market hours
    epsEstimate: number | null;
    revenueEstimate: number | null;
    fiscalQuarter: number | null;
    fiscalYear: number | null;
}

interface FinnhubCalendarResponse {
    earningsCalendar: Array<{
        symbol: string;
        date: string;
        hour: string; // "bmo" | "amc" | "dmh" | ""
        epsEstimate: number | null;
        revenueEstimate: number | null;
        quarter: number | null;
        year: number | null;
    }>;
}

function normalizeSession(hour: string): EarningsCalendarEntry["session"] {
    if (hour === "bmo" || hour === "amc" || hour === "dmh") return hour;
    return "unknown";
}

export class FinnhubEarningsCalendarProvider {

    /**
     * All confirmed earnings dates across the market in [from, to].
     * Used to power the homepage "Upcoming Earnings" widget.
     */
    public async getRange(from: string, to: string): Promise<EarningsCalendarEntry[]> {

        const result = await finnhubFetch<FinnhubCalendarResponse>(
            `/calendar/earnings?from=${from}&to=${to}`
        );

        const rows = result?.earningsCalendar ?? [];

        return rows.map(row => ({
            symbol: row.symbol,
            reportDate: row.date,
            session: normalizeSession(row.hour),
            epsEstimate: row.epsEstimate ?? null,
            revenueEstimate: row.revenueEstimate ?? null,
            fiscalQuarter: row.quarter ?? null,
            fiscalYear: row.year ?? null,
        }));
    }

    /**
     * The next confirmed earnings date for one symbol, if Finnhub has
     * one scheduled within the lookout window. Returns null (not a
     * thrown error) when nothing is scheduled — "no upcoming
     * earnings" is a normal, expected state, not a failure.
     */
    public async getNext(symbol: string, lookoutDays = 120): Promise<EarningsCalendarEntry | null> {

        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + lookoutDays);

        const toIso = (d: Date) => d.toISOString().slice(0, 10);

        const result = await finnhubFetch<FinnhubCalendarResponse>(
            `/calendar/earnings?from=${toIso(from)}&to=${toIso(to)}&symbol=${symbol}`
        );

        const rows = result?.earningsCalendar ?? [];
        if (rows.length === 0) return null;

        // Finnhub can return more than one row per symbol (e.g. a
        // stale past entry plus the confirmed upcoming one) — take
        // the earliest date that hasn't already passed.
        const todayIso = toIso(new Date());
        const upcoming = rows
            .filter(r => r.date >= todayIso)
            .sort((a, b) => a.date.localeCompare(b.date))[0];

        if (!upcoming) return null;

        return {
            symbol: upcoming.symbol,
            reportDate: upcoming.date,
            session: normalizeSession(upcoming.hour),
            epsEstimate: upcoming.epsEstimate ?? null,
            revenueEstimate: upcoming.revenueEstimate ?? null,
            fiscalQuarter: upcoming.quarter ?? null,
            fiscalYear: upcoming.year ?? null,
        };
    }

}
