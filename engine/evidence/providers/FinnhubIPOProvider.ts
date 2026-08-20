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

    async getUpcomingIPOs(limit = 12): Promise<IPOCalendarEntry[]> {
        const apiKey = process.env.FINNHUB_API_KEY;
        if (!apiKey) {
            return [];
        }

        try {
            const from = new Date();
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
                console.error(`FinnhubIPOProvider (upcoming): real request failed — status ${response.status}`);
                return [];
            }

            const data = await response.json();
            const entries: IPOCalendarEntry[] = data.ipoCalendar ?? [];
            const todayStr = from.toISOString().slice(0, 10);

            return entries
                .filter(e => e.symbol && e.date && e.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, limit);
        } catch (err) {
            console.error("FinnhubIPOProvider (upcoming) threw:", err instanceof Error ? err.message : err);
            return [];
        }
    }
}
