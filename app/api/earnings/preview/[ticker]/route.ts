import { NextRequest, NextResponse } from "next/server";
import { FinnhubEarningsCalendarProvider } from "@/engine/earnings/providers/FinnhubEarningsCalendarProvider";
import { EarningsPreviewSynthesizer } from "@/engine/earnings/EarningsPreviewSynthesizer";

/**
 * Powers EarningsPreviewPanel on the research page. Two layers, kept
 * visibly separate in the response so the UI never blends them:
 *
 *  - calendar: real Finnhub data (date, session, consensus estimates).
 *    `available: false` is a normal, expected state (no earnings
 *    scheduled) — not an error.
 *  - preview: AI-generated interpretation (topics to watch, bull/bear
 *    case, probabilities, weighting), grounded on the calendar data
 *    above and nothing else. `available: false` here just means the
 *    AI layer isn't configured or failed — the verified calendar data
 *    is still returned and still useful on its own.
 */

// Revalidate hourly — confirmed earnings dates and consensus
// estimates don't change minute to minute.
export const revalidate = 3600;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticker: string }> }
) {
    const { ticker: rawTicker } = await params;
    const ticker = rawTicker.toUpperCase();

    const sector = request.nextUrl.searchParams.get("sector") ?? "Unknown";
    const industry = request.nextUrl.searchParams.get("industry") ?? "Unknown";
    const companyName = request.nextUrl.searchParams.get("name") ?? ticker;

    if (!process.env.FINNHUB_API_KEY) {
        return NextResponse.json({
            calendar: { available: false, reason: "FINNHUB_API_KEY not configured." },
            preview: { available: false, reason: "No calendar data to ground AI analysis on." },
        });
    }

    let entry;
    try {
        entry = await new FinnhubEarningsCalendarProvider().getNext(ticker);
    } catch (err) {
        return NextResponse.json({
            calendar: {
                available: false,
                reason: err instanceof Error ? err.message : "Finnhub calendar request failed.",
            },
            preview: { available: false, reason: "No calendar data to ground AI analysis on." },
        });
    }

    if (!entry) {
        return NextResponse.json({
            calendar: { available: false, reason: "No upcoming earnings date is currently scheduled." },
            preview: { available: false, reason: "No calendar data to ground AI analysis on." },
        });
    }

    const calendar = {
        available: true,
        reportDate: entry.reportDate,
        session: entry.session,
        epsEstimate: entry.epsEstimate,
        revenueEstimate: entry.revenueEstimate,
        fiscalQuarter: entry.fiscalQuarter,
        fiscalYear: entry.fiscalYear,
    };

    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({
            calendar,
            preview: { available: false, reason: "ANTHROPIC_API_KEY not configured." },
        });
    }

    try {
        const preview = await new EarningsPreviewSynthesizer().synthesize(
            companyName,
            sector,
            industry,
            entry
        );

        return NextResponse.json({
            calendar,
            preview: { available: true, ...preview },
        });
    } catch (err) {
        return NextResponse.json({
            calendar,
            preview: {
                available: false,
                reason: err instanceof Error ? err.message : "AI synthesis failed.",
            },
        });
    }
}
