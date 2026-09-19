import { NextRequest, NextResponse } from "next/server";
import { EarningsPipeline } from "@/engine/earnings/EarningsPipeline";

export const revalidate = 3600;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticker: string }> }
) {
    const { ticker: rawTicker } = await params;
    const ticker = rawTicker.toUpperCase();

    if (!process.env.FINNHUB_API_KEY) {
        return NextResponse.json({
            available: false,
            reason: "FINNHUB_API_KEY not configured.",
            history: [],
        });
    }

    try {
        const pipeline = new EarningsPipeline();
        const history = await pipeline.provider.getHistory(ticker);

        if (!history.length) {
            return NextResponse.json({
                available: false,
                reason: `No reported earnings history found for ${ticker}.`,
                history: [],
            });
        }

        return NextResponse.json({
            available: true,
            ticker,
            history: history.map((event) => ({
                fiscalQuarter: event.fiscalQuarter,
                fiscalYear: event.fiscalYear,
                reportDate: event.reportDate,
                actualEPS: event.actualEPS,
                estimatedEPS: event.estimatedEPS,
                actualRevenue: event.actualRevenue,
                estimatedRevenue: event.estimatedRevenue,
            })),
        });
    } catch (err) {
        return NextResponse.json({
            available: false,
            reason:
                err instanceof Error
                    ? err.message
                    : "Unable to retrieve earnings history.",
            history: [],
        });
    }
}