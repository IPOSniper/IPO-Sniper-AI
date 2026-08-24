import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/serviceRole";
import { buildOpportunityUniverseWithStatus } from "@/engine/quant/OpportunityEngine";
import crypto from "crypto";

/**
 * Real, dedicated Opportunity Discovery cron -- deliberately separate
 * from /api/cron/quant-harness. quant-harness's real function
 * (ObservationCycle.ts) is a trading/decision execution cycle and
 * never calls OpportunityEngine at all (confirmed by reading its real
 * content) -- this route is the actual persistence hook for
 * OpportunityEngine's real buildOpportunityUniverseWithStatus() output.
 *
 * Deliberately NOT gated on isMarketOpen() -- discovery (SEC/news/
 * earnings/price events) has real value outside regular trading hours,
 * unlike live execution; execution eligibility is a separate concern
 * from discovery, per direct instruction.
 *
 * Honest health handling: if ALL providers failed, do not write "0
 * opportunities" (would misrepresent a data failure as "nothing
 * found"). If SOME providers failed but real opportunities were still
 * returned, persist the real ones and report partial health.
 *
 * Explicit insert-vs-update path (not upsert()), per direct
 * instruction: Supabase's upsert() overwrites every column not in the
 * payload back to its table default on conflict via PostgREST -- it is
 * NOT a safe partial update. A genuinely new opportunity gets
 * detected_at/status set once, on insert only. An existing opportunity
 * (same user_id + fingerprint) only ever has score/events/
 * score_breakdown/last_seen_at/updated_at updated -- detected_at and
 * status (including any real downstream lifecycle state a later
 * feature sets, e.g. "risk_review") are never touched by this cron
 * again once the row exists.
 *
 * fingerprint = hash(ticker + top event's category + top event's
 * timestamp) -- not just ticker + date, since one ticker can generate
 * multiple genuinely distinct opportunities in a single day as new
 * evidence arrives.
 *
 * NOTE: written against documented Supabase/Postgres syntax, not run
 * against a live database from this sandbox (no network access here).
 */

function buildFingerprint(ticker: string, topEventCategory: string, topEventTimestamp: string): string {
    return crypto
        .createHash("sha256")
        .update(`${ticker}|${topEventCategory}|${topEventTimestamp}`)
        .digest("hex")
        .slice(0, 32);
}

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
            return NextResponse.json({ success: true, skipped: true, reason: "No real user found to persist opportunities for." });
        }

        const { rankedOpportunities, failedProviders } = await buildOpportunityUniverseWithStatus();

        const totalProviders = 4; // sec, news, earnings, price -- matches OpportunityEngine's real categories array
        if (failedProviders.length === totalProviders) {
            return NextResponse.json({
                success: true,
                skipped: true,
                reason: "All providers failed -- not writing '0 opportunities', since that would misrepresent a real data failure as a genuine empty result.",
                failedProviders,
            });
        }

        if (rankedOpportunities.length === 0) {
            return NextResponse.json({
                success: true,
                inserted: 0,
                updated: 0,
                reason: "Providers responded but found no real opportunities this run -- a genuine empty result, not a failure.",
                failedProviders,
            });
        }

        const nowIso = new Date().toISOString();
        let insertedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        for (const opp of rankedOpportunities) {
            const topEvent = opp.events[0];
            const fingerprint = topEvent
                ? buildFingerprint(opp.ticker, topEvent.category, topEvent.timestamp)
                : buildFingerprint(opp.ticker, "none", nowIso.slice(0, 10));

            const { data: existing } = await supabase
                .from("opportunities")
                .select("id")
                .eq("user_id", realUserId)
                .eq("fingerprint", fingerprint)
                .maybeSingle();

            if (!existing) {
                const { error: insertError } = await supabase.from("opportunities").insert({
                    user_id: realUserId,
                    fingerprint,
                    ticker: opp.ticker,
                    score: opp.score,
                    events: opp.events,
                    score_breakdown: opp.scoreBreakdown,
                    status: "discovered",
                    detected_at: nowIso,
                    last_seen_at: nowIso,
                    updated_at: nowIso,
                });
                if (insertError) {
                    errors.push(`insert ${opp.ticker}: ${insertError.message}`);
                } else {
                    insertedCount++;
                }
            } else {
                const { error: updateError } = await supabase
                    .from("opportunities")
                    .update({
                        score: opp.score,
                        events: opp.events,
                        score_breakdown: opp.scoreBreakdown,
                        last_seen_at: nowIso,
                        updated_at: nowIso,
                    })
                    .eq("id", existing.id);
                if (updateError) {
                    errors.push(`update ${opp.ticker}: ${updateError.message}`);
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
            failedProviders: failedProviders.length > 0 ? failedProviders : undefined,
            health: failedProviders.length > 0 ? "partial" : "healthy",
        });
    } catch (err) {
        return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Unknown real error." }, { status: 500 });
    }
}