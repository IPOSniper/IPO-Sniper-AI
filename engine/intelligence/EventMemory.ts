/**
 * Real Quant Event Memory -- Round 4's first, most foundational
 * piece, built ahead of Round 3's Pattern Recognition per real
 * dependency order (Pattern Recognition and Novelty Detection both
 * need real historical events to compare against; there was nothing
 * to compare against until this existed). The actual persistence
 * layer behind round86's MarketEvent schema -- events existed as an
 * in-memory type only until now.
 *
 * No "use server" here, matching the established convention -- this
 * is a plain server-only utility module (like SECEdgarProvider.ts,
 * AlpacaPaperTradingProvider.ts, etc.), called from within a real
 * app/*\/actions.ts file, not a Next.js Server Action itself.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { MarketEvent } from "@/engine/data-sources/MarketEvent";

/**
 * Real, persisted save of one event. Best-effort -- a failed save
 * shouldn't block whatever real workflow ingested the event in the
 * first place, but the real reason is logged (not silently
 * swallowed, same fix pattern already applied to every other insert
 * this session) so a genuine failure is still discoverable.
 */
export async function saveEvent(userId: string, event: MarketEvent): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        const supabase = await createClient();
        const { error } = await supabase.from("market_events").insert({
            user_id: userId,
            event_id: event.eventId,
            ticker: event.ticker,
            occurred_at: event.occurredAt,
            detected_at: event.detectedAt,
            event_type: event.eventType,
            source_id: event.sourceId,
            intended_purpose: event.intendedPurpose,
            source_confidence: event.sourceConfidence,
            materiality: event.materiality,
            novelty_score: event.noveltyScore,
            headline: event.headline,
            summary: event.summary,
        });
        if (error) {
            console.error("market_events insert failed:", error.message);
        }
    } catch (err) {
        console.error("saveEvent threw:", err instanceof Error ? err.message : err);
    }
}

/**
 * Real historical event count for a ticker + event type combination
 * -- the actual real signal Novelty Engine needs. A ticker/type pair
 * with zero prior real events genuinely IS more novel than one with
 * a long real history, and this is the first place that comparison
 * becomes possible with real data instead of a guess.
 */
export async function getHistoricalEventCount(userId: string, ticker: string, eventType: string): Promise<number> {
    if (!isSupabaseConfigured()) return 0;
    try {
        const supabase = await createClient();
        const { count, error } = await supabase
            .from("market_events")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("ticker", ticker)
            .eq("event_type", eventType);

        if (error || count === null) return 0;
        return count;
    } catch {
        return 0;
    }
}
