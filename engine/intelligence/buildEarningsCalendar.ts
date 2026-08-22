import { FinnhubEarningsCalendarProvider } from "@/engine/earnings/providers/FinnhubEarningsCalendarProvider";

// Extracted from app/api/earnings/calendar/route.ts so it can be called
// directly (in-process, no HTTP, no auth dependency) by both the route
// handler and live-feed/route.ts's buildEarningsEvents(). Same fix as
// buildIpoWatchCompanies() -- live-feed's builder previously did
// fetch(`${base}/api/earnings/calendar?days=2`), a server-to-server
// request blocked by Vercel Deployment Protection, silently returning []
// in production regardless of the actual calendar data.

type EarningsEntry = Awaited<ReturnType<FinnhubEarningsCalendarProvider["getRange"]>>[number];

export interface EarningsCalendarResult {
    items: EarningsEntry[];
    available: boolean;
    reason?: string;
    fetchedAt?: string;
}

/**
 * Shared, in-process earnings calendar logic. Returns the same shape
 * earnings/calendar/route.ts's GET() previously returned directly.
 */
export async function buildEarningsCalendar(days: number = 7): Promise<EarningsCalendarResult> {
    if (!process.env.FINNHUB_API_KEY) {
        return { items: [], available: false, reason: "FINNHUB_API_KEY not configured." };
    }

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + Math.max(1, Math.min(days, 14)));

    const toIso = (d: Date) => d.toISOString().slice(0, 10);

    try {
        const entries = await new FinnhubEarningsCalendarProvider().getRange(toIso(from), toIso(to));

        const sorted = [...entries].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
        const withEstimates = sorted.filter(e => e.epsEstimate !== null || e.revenueEstimate !== null);
        const withoutEstimates = sorted.filter(e => e.epsEstimate === null && e.revenueEstimate === null);

        const items = [...withEstimates, ...withoutEstimates].slice(0, 40);

        return { items, available: true, fetchedAt: new Date().toISOString() };
    } catch (err) {
        return {
            items: [],
            available: false,
            reason: err instanceof Error ? err.message : "Finnhub calendar request failed.",
        };
    }
}