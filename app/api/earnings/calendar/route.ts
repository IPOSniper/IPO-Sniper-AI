import { NextRequest, NextResponse } from "next/server";
import { FinnhubEarningsCalendarProvider } from "@/engine/earnings/providers/FinnhubEarningsCalendarProvider";

/**
 * Feeds the Workstation homepage's "Upcoming Earnings" widget — a
 * market-wide, ticker-agnostic view (same spirit as market-news's
 * NewsRail feed) shown before the user has searched anything.
 *
 * Real Finnhub data only. Finnhub's free tier returns every US
 * confirmed date in range without filtering by market cap, so this
 * can be a long list — the route caps it and lets the client narrow
 * further if needed.
 */

export const revalidate = 3600;

export async function GET(request: NextRequest) {
    const days = Number(request.nextUrl.searchParams.get("days") ?? "7");

    if (!process.env.FINNHUB_API_KEY) {
        return NextResponse.json({ items: [], available: false, reason: "FINNHUB_API_KEY not configured." });
    }

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + Math.max(1, Math.min(days, 14)));

    const toIso = (d: Date) => d.toISOString().slice(0, 10);

    try {
        const entries = await new FinnhubEarningsCalendarProvider().getRange(toIso(from), toIso(to));

        // Sort chronologically, then cap — this endpoint returns
        // every confirmed US date in range, which can be hundreds of
        // small-cap tickers with no estimate coverage. Prioritize
        // rows that actually have consensus estimates (a rough,
        // honest proxy for "a covered, tradeable name") before
        // falling back to the rest.
        const sorted = [...entries].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
        const withEstimates = sorted.filter(e => e.epsEstimate !== null || e.revenueEstimate !== null);
        const withoutEstimates = sorted.filter(e => e.epsEstimate === null && e.revenueEstimate === null);

        const items = [...withEstimates, ...withoutEstimates].slice(0, 40);

        return NextResponse.json({ items, available: true, fetchedAt: new Date().toISOString() });
    } catch (err) {
        return NextResponse.json({
            items: [],
            available: false,
            reason: err instanceof Error ? err.message : "Finnhub calendar request failed.",
        });
    }
}
