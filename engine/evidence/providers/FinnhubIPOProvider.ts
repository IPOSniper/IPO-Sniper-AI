/**
 * Real Finnhub IPO calendar client — /calendar/ipo, documented,
 * requires FINNHUB_API_KEY (already required elsewhere in this
 * codebase for FinancialProvider). Written against documented
 * response shape, not run live.
 *
 * Known limitation: Finnhub's IPO calendar does not include
 * underwriters — that comes from SecBuilder's prospectus extraction
 * instead. This provider covers date/price/shares only.
 */

export interface IPOCalendarEntry {
    date: string;
    symbol: string;
    price: string;
    numberOfShares: number;
    totalSharesValue: number;
    status: string;
}

export class FinnhubIPOProvider {

    async getIPO(ticker: string): Promise<IPOCalendarEntry | null> {

        const apiKey = process.env.FINNHUB_API_KEY;

        if (!apiKey) {
            throw new Error("FINNHUB_API_KEY is missing.");
        }

        // Finnhub's calendar is date-ranged, not ticker-keyed, so we
        // have to pull a wide window and filter client-side. A ~2
        // year lookback covers most recent IPOs a research tool would
        // realistically be asked about.
        const from = new Date();
        from.setFullYear(from.getFullYear() - 2);
        const to = new Date();
        to.setMonth(to.getMonth() + 3);

        const params = new URLSearchParams({
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
            token: apiKey,
        });

        const response = await fetch(
            `https://finnhub.io/api/v1/calendar/ipo?${params.toString()}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`Finnhub IPO calendar request failed: ${response.status}`);
        }

        const data = await response.json();
        const entries: IPOCalendarEntry[] = data.ipoCalendar ?? [];

        return entries.find(e => e.symbol?.toUpperCase() === ticker.toUpperCase()) ?? null;
    }

}
