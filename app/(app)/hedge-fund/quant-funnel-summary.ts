"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Real, honest Quant funnel summary for the Workstation's Quant Live
 * Desk. Reuses the same real tables (quant_trade_decisions,
 * paper_trade_orders) rejection-breakdown/actions.ts and
 * activity-feed/actions.ts already query -- no new schema, no new
 * execution path.
 *
 * "Filled" is derived from Alpaca's own filled_at field being
 * non-null (confirmed via AlpacaPaperTradingProvider.ts and
 * OutcomeAttribution.ts, which both use filled_at as the real
 * fill indicator) -- not a guessed status string.
 *
 * Discovery, Risk Approved, and Completed have no confirmed source
 * as of this pass -- explicitly null rather than a fabricated
 * number. A null value must render as "Unavailable" in the UI, never
 * as 0 (0 is a real, different claim: "checked, found none").
 */
export interface QuantFunnelSummary {
    discovery: number | null;
    decisions: number | null;
    plans: number | null;
    riskApproved: number | null;
    orders: number | null;
    filled: number | null;
    completed: number | null;
}

export async function getQuantFunnelSummary(days = 7): Promise<QuantFunnelSummary> {
    const unavailable: QuantFunnelSummary = {
        discovery: null, decisions: null, plans: null,
        riskApproved: null, orders: null, filled: null, completed: null,
    };

    if (!isSupabaseConfigured()) return unavailable;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return unavailable;

        const since = new Date();
        since.setDate(since.getDate() - days);

        const [decisionsResult, ordersResult] = await Promise.all([
            supabase
                .from("quant_trade_decisions")
                .select("direction")
                .eq("user_id", user.id)
                .gte("created_at", since.toISOString()),
            supabase
                .from("paper_trade_orders")
                .select("filled_at")
                .eq("user_id", user.id)
                .gte("created_at", since.toISOString()),
        ]);

        const decisions = decisionsResult.data ?? [];
        const orders = ordersResult.data ?? [];

        return {
            discovery: null,
            decisions: decisions.length,
            plans: decisions.filter(d => d.direction !== "none").length,
            riskApproved: null,
            orders: orders.length,
            filled: orders.filter(o => o.filled_at !== null).length,
            completed: null,
        };
    } catch {
        return unavailable;
    }
}