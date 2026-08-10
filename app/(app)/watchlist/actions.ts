"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface WatchlistRow {
    id: string;
    ticker: string;
    createdAt: string;
}

export interface WatchlistActionResult {
    success: boolean;
    error?: string;
}

export async function getWatchlist(): Promise<WatchlistRow[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("watchlist")
        .select("id, ticker, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map(row => ({ id: row.id, ticker: row.ticker, createdAt: row.created_at }));
}

export async function addToWatchlist(rawTicker: string): Promise<WatchlistActionResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: "Authentication is not configured." };
    }

    const ticker = rawTicker.trim().toUpperCase();

    if (!/^[A-Z.]{1,10}$/.test(ticker)) {
        return { success: false, error: "That doesn't look like a valid ticker." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in." };
    }

    const { error } = await supabase.from("watchlist").insert({ user_id: user.id, ticker });

    if (error) {
        // Unique(user_id, ticker) violation reads as "already watching this" —
        // a much more useful message than the raw Postgres error text.
        if (error.code === "23505") {
            return { success: false, error: `Already watching ${ticker}.` };
        }
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function removeFromWatchlist(id: string): Promise<WatchlistActionResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: "Authentication is not configured." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in." };
    }

    const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // belt-and-suspenders alongside the RLS policy

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
