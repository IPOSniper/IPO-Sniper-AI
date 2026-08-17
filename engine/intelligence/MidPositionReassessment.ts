/**
 * Real Mid-Position Adaptive Thesis Reassessment -- 106B, first
 * version. Distinct from round97's ThesisReassessmentEngine (which
 * compares two past DECISIONS against each other) -- this answers a
 * different real question the Rounds 6-7/104-105 bootstraps
 * describe: for an OPEN position, has a new, material real event
 * arrived since it was entered, and did the price actually react to
 * it?
 *
 * No "use server" here -- same convention fix already caught and
 * applied multiple times this session for engine/ modules.
 *
 * Real, deliberately read-only scoping, consistent with
 * PositionMonitor.ts (round102): this produces a real recommendation
 * signal. It does NOT itself exit, adjust, or reverse any position --
 * automatically acting on a reassessment is a real, separate, much
 * bigger safety decision, same reasoning already applied to
 * PositionMonitor.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getPriceReaction, type PriceReaction } from "./EventPriceReaction";
import type { EventType, MaterialityLevel } from "@/engine/data-sources/MarketEvent";

export interface MidPositionEvent {
    eventId: string;
    eventType: EventType;
    materiality: MaterialityLevel;
    headline: string;
    occurredAt: string;
    priceReaction: PriceReaction;
}

export interface MidPositionReassessment {
    ticker: string;
    entryAt: string;
    /** Real events found for this ticker that occurred after real entry -- empty array is an honest, valid outcome (nothing material has happened since entry). */
    eventsSinceEntry: MidPositionEvent[];
    /** True only when a real high/critical-materiality event occurred since entry -- a real, simple trigger for "this position may need human review," not an automated action. */
    warrantsReview: boolean;
}

/**
 * Real, read-only reassessment for one open position. Finds every
 * real market_events row for this ticker with occurred_at after the
 * real entry time, and for each, computes its real price reaction.
 */
export async function reassessOpenPosition(userId: string, ticker: string, entryAt: string): Promise<MidPositionReassessment> {
    const normalizedTicker = ticker.trim().toUpperCase();
    const base: MidPositionReassessment = { ticker: normalizedTicker, entryAt, eventsSinceEntry: [], warrantsReview: false };

    if (!isSupabaseConfigured()) return base;

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("market_events")
            .select("event_id, event_type, materiality, headline, occurred_at")
            .eq("user_id", userId)
            .eq("ticker", normalizedTicker)
            .gt("occurred_at", entryAt)
            .order("occurred_at", { ascending: true });

        if (error || !data || data.length === 0) return base;

        const eventsSinceEntry: MidPositionEvent[] = await Promise.all(
            data.map(async row => ({
                eventId: row.event_id,
                eventType: row.event_type as EventType,
                materiality: row.materiality as MaterialityLevel,
                headline: row.headline,
                occurredAt: row.occurred_at,
                priceReaction: await getPriceReaction(normalizedTicker, row.occurred_at),
            }))
        );

        const warrantsReview = eventsSinceEntry.some(e => e.materiality === "high" || e.materiality === "critical");

        return { ...base, eventsSinceEntry, warrantsReview };
    } catch (err) {
        console.error(`reassessOpenPosition failed for ${normalizedTicker}:`, err instanceof Error ? err.message : err);
        return base;
    }
}
