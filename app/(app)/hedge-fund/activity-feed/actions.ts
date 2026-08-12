"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface ActivityEvent {
    id: string;
    timestamp: string;
    type: "decision" | "order";
    ticker: string;
    label: string;
    detail: string;
}

/**
 * Real activity feed -- merges two real, already-existing tables
 * (quant_trade_decisions, paper_trade_orders) into one chronological
 * feed. Deliberately does NOT include fabricated event types like
 * "Committee upgraded X" or "SEC filing detected" -- those aren't
 * real logged events anywhere in this system. What IS real: a trade
 * plan decision was made (direction + outcome), or a real order was
 * submitted/filled.
 */
export async function getActivityFeed(limit = 20): Promise<ActivityEvent[]> {
    if (!isSupabaseConfigured()) return [];
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const [decisionsResult, ordersResult] = await Promise.all([
            supabase
                .from("quant_trade_decisions")
                .select("id, ticker, direction, trade_quality_score, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(limit),
            supabase
                .from("paper_trade_orders")
                .select("id, ticker, side, qty, status, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(limit),
        ]);

        const decisionEvents: ActivityEvent[] = (decisionsResult.data ?? []).map(d => ({
            id: `decision-${d.id}`,
            timestamp: d.created_at,
            type: "decision" as const,
            ticker: d.ticker,
            label: d.direction === "none" ? "No Trade" : `Trade Plan: ${d.direction === "call" ? "Long Call" : "Long Put"}`,
            detail: `Trade Quality ${d.trade_quality_score}/100`,
        }));

        const orderEvents: ActivityEvent[] = (ordersResult.data ?? []).map(o => ({
            id: `order-${o.id}`,
            timestamp: o.created_at,
            type: "order" as const,
            ticker: o.ticker,
            label: `${o.side.toUpperCase()} ${o.qty} — ${o.status}`,
            detail: o.status,
        }));

        return [...decisionEvents, ...orderEvents]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    } catch {
        return [];
    }
}
