import { NextRequest, NextResponse } from "next/server";
import { OvernightWatcher, getWatchedTickers } from "@/engine/automation/watchers/OvernightWatcher";

/**
 * Called on a schedule (see vercel.json) rather than by a browser —
 * gated by CRON_SECRET instead of a user session. Vercel Cron sends
 * an Authorization: Bearer <CRON_SECRET> header automatically when
 * this env var is set; anything else gets a 401.
 *
 * Runs sequentially per ticker on purpose, not Promise.all — SEC
 * EDGAR and NewsAPI both have real rate limits, and a watchlist of
 * any size firing every request at once is the fastest way to start
 * getting 429s from providers you need working for actual research
 * runs too.
 */
export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        return NextResponse.json(
            { success: false, error: "CRON_SECRET is not configured." },
            { status: 500 }
        );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const tickers = await getWatchedTickers();
    const watcher = new OvernightWatcher();

    const results: Record<string, { alertCount: number; error?: string }> = {};

    for (const ticker of tickers) {
        try {
            const alerts = await watcher.checkTicker(ticker);
            results[ticker] = { alertCount: alerts.length };
        } catch (err) {
            results[ticker] = {
                alertCount: 0,
                error: err instanceof Error ? err.message : "Unknown error",
            };
        }
    }

    return NextResponse.json({
        success: true,
        checkedAt: new Date().toISOString(),
        tickerCount: tickers.length,
        results,
    });
}
