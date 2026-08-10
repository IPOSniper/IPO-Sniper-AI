import { NextRequest, NextResponse } from "next/server";
import { EarningsPipeline } from "@/engine/earnings/EarningsPipeline";
import { EarningsRecapSynthesizer } from "@/engine/earnings/EarningsRecapSynthesizer";

/**
 * The "after" half of the before/after pair — /api/earnings/preview
 * is the before. Two layers, same separation as the preview route:
 *
 *  - results: real data (FinnhubEarningsProvider) run through the
 *    now-bug-fixed EPSAnalyzer/RevenueAnalyzer — actual EPS/revenue,
 *    beat/miss, real prior-period growth, computed quality scores.
 *  - recap: AI-generated interpretation grounded on `results` only.
 *
 * `results.available: false` covers the normal case of a company
 * with no reported earnings history on Finnhub yet (e.g. a very
 * recent IPO) — not an error.
 */

export const revalidate = 3600;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticker: string }> }
) {
    const { ticker: rawTicker } = await params;
    const ticker = rawTicker.toUpperCase();
    const companyName = request.nextUrl.searchParams.get("name") ?? ticker;

    if (!process.env.FINNHUB_API_KEY) {
        return NextResponse.json({
            results: { available: false, reason: "FINNHUB_API_KEY not configured." },
            recap: { available: false, reason: "No results to ground AI analysis on." },
        });
    }

    const pipeline = new EarningsPipeline();

    let event;
    try {
        event = await pipeline.provider.getLatest(ticker);
    } catch (err) {
        return NextResponse.json({
            results: {
                available: false,
                reason: err instanceof Error ? err.message : "No reported earnings found.",
            },
            recap: { available: false, reason: "No results to ground AI analysis on." },
        });
    }

    const revenue = pipeline.revenueAnalyzer.analyze(
        event.actualRevenue,
        event.estimatedRevenue,
        event.previousRevenue ?? 0
    );
    const eps = pipeline.epsAnalyzer.analyze(
        event.actualEPS,
        event.estimatedEPS,
        event.previousEPS ?? 0
    );

    const results = {
        available: true,
        fiscalQuarter: event.fiscalQuarter,
        fiscalYear: event.fiscalYear,
        reportDate: event.reportDate,
        actualEPS: event.actualEPS,
        estimatedEPS: event.estimatedEPS,
        epsBeat: eps.beat,
        epsSurprisePercent: eps.surprisePercent,
        actualRevenue: event.actualRevenue,
        estimatedRevenue: event.estimatedRevenue,
        revenueBeat: revenue.beat,
        revenueSurprisePercent: revenue.surprisePercent,
        revenueGrowthYoY: event.previousRevenue !== null ? revenue.revenueGrowthYoY : null,
        epsQualityScore: eps.qualityScore,
        revenueQualityScore: revenue.qualityScore,
    };

    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({
            results,
            recap: { available: false, reason: "ANTHROPIC_API_KEY not configured." },
        });
    }

    try {
        const recap = await new EarningsRecapSynthesizer().synthesize(
            companyName,
            event,
            { revenue, eps }
        );
        return NextResponse.json({ results, recap: { available: true, ...recap } });
    } catch (err) {
        return NextResponse.json({
            results,
            recap: { available: false, reason: err instanceof Error ? err.message : "AI synthesis failed." },
        });
    }
}
