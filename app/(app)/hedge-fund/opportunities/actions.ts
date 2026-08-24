"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Real read-only accessor for the persisted opportunities table --
 * the UI reads this, it does NOT call OpportunityEngine directly.
 * Uses the session-based client (respects the real RLS "select own
 * rows" policy), not the service-role client the cron uses.
 *
 * Deliberately does NOT advance status -- this accessor only reads
 * whatever the persistence layer (the dedicated cron) has written.
 * Real downstream lifecycle transitions are a separate, future
 * concern, not something this read path invents.
 */
export interface PersistedOpportunityEvent {
    ticker: string | null;
    category: string;
    description: string;
    timestamp: string;
    source: string;
    sourceUrl: string | null;
}

export interface PersistedOpportunity {
    id: string;
    ticker: string;
    score: number;
    events: PersistedOpportunityEvent[];
    scoreBreakdown: string[];
    status: string;
    detectedAt: string;
    lastSeenAt: string;
    updatedAt: string;
}

export async function getCurrentOpportunities(): Promise<PersistedOpportunity[]> {
    if (!isSupabaseConfigured()) return [];
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("opportunities")
            .select("id, ticker, score, events, score_breakdown, status, detected_at, last_seen_at, updated_at")
            .eq("user_id", user.id)
            .order("score", { ascending: false });

        if (error || !data) return [];

        return data.map(row => ({
            id: row.id,
            ticker: row.ticker,
            score: row.score,
            events: row.events ?? [],
            scoreBreakdown: row.score_breakdown ?? [],
            status: row.status,
            detectedAt: row.detected_at,
            lastSeenAt: row.last_seen_at,
            updatedAt: row.updated_at,
        }));
    } catch {
        return [];
    }
}