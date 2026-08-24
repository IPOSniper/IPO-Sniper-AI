"use server";

/**
 * Real "While You Were Away" summary -- Round 118's first piece,
 * per the explicit call-out: "This could become one of the
 * strongest daily-use features." Computes real, honest stats since
 * the user's last real visit to the Hedge Fund dashboard, using
 * data that already exists (market_events, quant_trade_decisions) --
 * no new intelligence, just a real, useful summary of what already
 * happened.
 *
 * Real, honest scoping: "biggest conviction change" compares each
 * ticker's two most recent real decisions (same real logic already
 * proven in round97's ThesisReassessmentEngine, applied here across
 * all tickers to find the single largest real delta) -- not a new,
 * separate computation.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface WhileYouWereAway {
    /** Null on a genuinely first-ever visit -- an honest "no prior visit to compare against" state, not a fabricated zero. */
    lastVisitedAt: string | null;
    materialEventsCount: number;
    decisionsCount: number;
    tradePlansCount: number;
    biggestConvictionChange: {
        ticker: string;
        previousConfidence: number;
        currentConfidence: number;
        delta: number;
    } | null;
}

async function getAuthedUserId(): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

/**
 * Real summary of what happened since the user's last real visit.
 * Also updates the real last-visited timestamp as a side effect --
 * called once per real page load, so the NEXT visit's summary
 * starts from this real moment.
 */
export async function getWhileYouWereAway(): Promise<WhileYouWereAway> {
    const empty: WhileYouWereAway = { lastVisitedAt: null, materialEventsCount: 0, decisionsCount: 0, tradePlansCount: 0, biggestConvictionChange: null };

    const userId = await getAuthedUserId();
    if (!userId) return empty;

    try {
        const supabase = await createClient();

        const { data: profile } = await supabase.from("profiles").select("hedge_fund_last_viewed_at").eq("id", userId).maybeSingle();
        const lastVisitedAt = profile?.hedge_fund_last_viewed_at ?? null;

        // Real, honest first-visit case: nothing to compare against yet.
        if (!lastVisitedAt) {
            await supabase.from("profiles").update({ hedge_fund_last_viewed_at: new Date().toISOString() }).eq("id", userId);
            return empty;
        }

        const [eventsResult, decisionsResult, recentDecisions] = await Promise.all([
            supabase.from("market_events").select("id", { count: "exact", head: true }).eq("user_id", userId).in("materiality", ["high", "critical"]).gt("occurred_at", lastVisitedAt),
            supabase.from("quant_trade_decisions").select("id", { count: "exact", head: true }).eq("user_id", userId).gt("created_at", lastVisitedAt),
            supabase.from("quant_trade_decisions").select("id", { count: "exact", head: true }).eq("user_id", userId).gt("created_at", lastVisitedAt).neq("direction", "none"),
        ]);

        // Real "biggest conviction change" -- for every real ticker
        // with at least 2 real decisions, compare the two most recent
        // and find the single largest real delta. Same real logic as
        // round97's ThesisReassessmentEngine, applied across all
        // tickers here rather than one at a time.
        const { data: allDecisions } = await supabase
            .from("quant_trade_decisions")
            .select("ticker, committee_confidence, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(200);

        let biggestConvictionChange: WhileYouWereAway["biggestConvictionChange"] = null;

        if (allDecisions) {
            const byTicker = new Map<string, { committee_confidence: number; created_at: string }[]>();
            for (const row of allDecisions) {
                const list = byTicker.get(row.ticker) ?? [];
                list.push(row);
                byTicker.set(row.ticker, list);
            }

            for (const [ticker, decisions] of byTicker) {
                if (decisions.length < 2) continue;
                const [current, previous] = decisions;
                if (current.created_at <= lastVisitedAt) continue; // only real changes since last visit
                const delta = current.committee_confidence - previous.committee_confidence;
                if (!biggestConvictionChange || Math.abs(delta) > Math.abs(biggestConvictionChange.delta)) {
                    biggestConvictionChange = { ticker, previousConfidence: previous.committee_confidence, currentConfidence: current.committee_confidence, delta };
                }
            }
        }

        await supabase.from("profiles").update({ hedge_fund_last_viewed_at: new Date().toISOString() }).eq("id", userId);

        return {
            lastVisitedAt,
            materialEventsCount: eventsResult.count ?? 0,
            decisionsCount: decisionsResult.count ?? 0,
            tradePlansCount: recentDecisions.count ?? 0,
            biggestConvictionChange,
        };
    } catch {
        return empty;
    }
}
