import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/serviceRole";
import { detectMomentum } from "@/engine/quant/MomentumDetector";

/**
 * Real, dedicated Momentum Radar discovery cron -- separate from
 * quant-harness (trading cycle) and quant-opportunities (opportunity
 * discovery), per direct instruction not to reuse the existing
 * trading cycle without a verified clean reuse point.
 *
 * Ticker source: distinct tickers already in the real, persisted
 * opportunities table -- per the intended architecture
 * (Current Opportunities -> Momentum Detector), not a separate
 * hardcoded watchlist.
 *
 * Same explicit insert-vs-update discipline as quant-opportunities
 * (NOT upsert()) -- detected_at must never be silently reset on
 * re-observation. fingerprint = ticker + today's date (UTC), since
 * RVOL is a daily-bar signal, not per-run.
 *
 * NOTE: written against documented Supabase/Postgres syntax, not run
 * against a live database from this sandbox (no network access here).
 */

export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        return NextResponse.json({ success: false, error: "CRON_SECRET is not configured." }, { status: 500 });
    }
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    if (!isServiceRoleConfigured()) {
        return NextResponse.json({ success: false, error: "Service role not configured." }, { status: 500 });
    }

    try {
        const supabase = createServiceRoleClient();

        const { data: profileRow } = await supabase
            .from("profiles")
            .select("id")
            .limit(1)
            .maybeSingle();
        const realUserId = profileRow?.id;
        if (!realUserId) {
            return NextResponse.json({ success: true, skipped: true, reason: "No real user found to persist momentum observations for." });
        }

        const { data: opportunityRows } = await supabase
            .from("opportunities")
            .select("ticker")
            .eq("user_id", realUserId);

        const tickers = Array.from(new Set((opportunityRows ?? []).map(r => r.ticker)));
        if (tickers.length === 0) {
            return NextResponse.json({ success: true, inserted: 0, updated: 0, reason: "No tickers in opportunities table yet -- run quant-opportunities first." });
        }

        const todayUtc = new Date().toISOString().slice(0, 10);
        let insertedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        for (const ticker of tickers) {
            const observation = await detectMomentum(ticker);
            const fingerprint = `${ticker}|${todayUtc}`;

            const { data: existing } = await supabase
                .from("momentum_observations")
                .select("id")
                .eq("user_id", realUserId)
                .eq("fingerprint", fingerprint)
                .maybeSingle();

            const nowIso = new Date().toISOString();

            if (!existing) {
                const { error: insertError } = await supabase.from("momentum_observations").insert({
                    user_id: realUserId,
                    fingerprint,
                    ticker: observation.ticker,
                    rvol: observation.rvol,
                    price_change_percent: observation.priceChangePercent,
                    stage: observation.stage,
                    current_volume: observation.currentVolume,
                    average_volume: observation.averageVolume,
                    latest_close: observation.latestClose,
                    detected_at: nowIso,
                    last_seen_at: nowIso,
                    updated_at: nowIso,
                });
                if (insertError) {
                    errors.push(`insert ${ticker}: ${insertError.message}`);
                } else {
                    insertedCount++;
                }
            } else {
                const { error: updateError } = await supabase
                    .from("momentum_observations")
                    .update({
                        rvol: observation.rvol,
                        price_change_percent: observation.priceChangePercent,
                        stage: observation.stage,
                        current_volume: observation.currentVolume,
                        average_volume: observation.averageVolume,
                        latest_close: observation.latestClose,
                        last_seen_at: nowIso,
                        updated_at: nowIso,
                    })
                    .eq("id", existing.id);
                if (updateError) {
                    errors.push(`update ${ticker}: ${updateError.message}`);
                } else {
                    updatedCount++;
                }
            }
        }

        return NextResponse.json({
            success: errors.length === 0,
            inserted: insertedCount,
            updated: updatedCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err) {
        return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Unknown real error." }, { status: 500 });
    }
}