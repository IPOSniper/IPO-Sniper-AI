"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Real read-only accessor for persisted momentum observations. The UI
 * reads this; it does NOT call detectMomentum() on every render.
 * Uses the session-based client (respects RLS), not the service-role
 * client the cron uses.
 */
export interface PersistedMomentumObservation {
    id: string;
    ticker: string;
    rvol: number | null;
    priceChangePercent: number | null;
    stage: string;
    currentVolume: number | null;
    averageVolume: number | null;
    latestClose: number | null;
    detectedAt: string;
    lastSeenAt: string;
    updatedAt: string;
}

export async function getMomentumObservations(): Promise<PersistedMomentumObservation[]> {
    if (!isSupabaseConfigured()) return [];
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("momentum_observations")
            .select("id, ticker, rvol, price_change_percent, stage, current_volume, average_volume, latest_close, detected_at, last_seen_at, updated_at")
            .eq("user_id", user.id)
            .order("rvol", { ascending: false, nullsFirst: false });

        if (error || !data) return [];

        return data.map(row => ({
            id: row.id,
            ticker: row.ticker,
            rvol: row.rvol,
            priceChangePercent: row.price_change_percent,
            stage: row.stage,
            currentVolume: row.current_volume,
            averageVolume: row.average_volume,
            latestClose: row.latest_close,
            detectedAt: row.detected_at,
            lastSeenAt: row.last_seen_at,
            updatedAt: row.updated_at,
        }));
    } catch {
        return [];
    }
}