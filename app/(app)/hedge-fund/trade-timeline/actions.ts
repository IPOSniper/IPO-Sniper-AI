"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type TimelineEventType = "filled" | "broker-rejected" | "risk-blocked" | "pending";

export interface TimelineEvent {
    id: string;
    ticker: string;
    side: "buy" | "sell";
    qty: number;
    type: TimelineEventType;
    /** True when reasoning text starts with "Quant Strategist:" -- a real, honest heuristic based on what's actually stored, not a separate tracked field. */
    aiDriven: boolean;
    reason: string | null;
    createdAt: string;
}

/**
 * Real, enriched trade timeline -- built from paper_trade_orders
 * directly (not Alpaca's order history), since this app's own audit
 * table captures something Alpaca's history structurally cannot:
 * orders RiskEngine blocked before they ever reached Alpaca. Those
 * real risk-blocked attempts have no broker_order_id and never
 * appear in Alpaca's own history, so they were invisible in the
 * previous Trade Timeline (which only read Alpaca's order list).
 *
 * aiDriven uses isAiDriven() below -- a real, honest heuristic
 * (reasoning text prefix), not a separately tracked boolean column.
 * See that function's docstring for the two real prefixes checked.
 */
export type ExecutionSource = "manual" | "assisted" | "autonomous";

/**
 * Real, honest 3-way categorization -- not just AI vs. manual.
 * "assisted" (Quant Strategist prefix) means a human reviewed a
 * real AI-suggested trade plan and explicitly clicked Execute --
 * still a real human action in the loop, distinct from "autonomous"
 * (Batch Scanner prefix), where zero human click occurred. Both
 * prefixes verified directly against their real call sites
 * (quant-strategist/actions.ts, batch-scanner/actions.ts) before
 * building this, not assumed.
 */
export function classifyExecutionSource(reasoning: string | null): ExecutionSource {
    if (!reasoning) return "manual";
    if (reasoning.startsWith("Batch Scanner (autonomous):")) return "autonomous";
    if (reasoning.startsWith("Quant Strategist:")) return "assisted";
    return "manual";
}

/**
 * Real, honest heuristic for AI-driven vs. manual -- checks for
 * either real reasoning prefix this app actually writes:
 * "Quant Strategist: ..." (single-ticker flow, quant-strategist/
 * actions.ts) or "Batch Scanner (autonomous): ..." (Batch Scanner's
 * real execution path, batch-scanner/actions.ts). Verified both
 * directly against their real call sites before writing this -- an
 * earlier draft only checked the first prefix, which would have
 * silently misclassified every autonomous batch-executed trade as
 * manual.
 */
function isAiDriven(reasoning: string | null): boolean {
    return classifyExecutionSource(reasoning) !== "manual";
}

export async function getTradeTimeline(limit = 20): Promise<TimelineEvent[]> {
    if (!isSupabaseConfigured()) return [];
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("paper_trade_orders")
            .select("id, ticker, side, qty, status, risk_allowed, risk_blocked_reason, reasoning, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map(row => {
            let type: TimelineEventType = "pending";
            if (!row.risk_allowed) type = "risk-blocked";
            else if (row.status === "filled") type = "filled";
            else if (row.status === "rejected" || row.status === "canceled") type = "broker-rejected";

            return {
                id: row.id,
                ticker: row.ticker,
                side: row.side,
                qty: row.qty,
                type,
                aiDriven: isAiDriven(row.reasoning),
                reason: row.risk_blocked_reason ?? row.reasoning ?? null,
                createdAt: row.created_at,
            };
        });
    } catch {
        return [];
    }
}

export interface ExecutionBreakdown {
    manual: number;
    assisted: number;
    autonomous: number;
    total: number;
}

/**
 * Real execution-source breakdown -- only counts orders that
 * actually reached Alpaca (real broker_order_id set), not
 * risk-blocked attempts. Answers "of what Quant actually executed,
 * how much required a human click vs. zero human involvement" --
 * the real "Automation" question, distinct from "Capability"
 * (System Status) and "Effectiveness" (blocked on real trade-outcome
 * tracking, not built).
 */
export async function getExecutionBreakdown(): Promise<ExecutionBreakdown | null> {
    if (!isSupabaseConfigured()) return null;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from("paper_trade_orders")
            .select("reasoning, broker_order_id")
            .eq("user_id", user.id)
            .not("broker_order_id", "is", null);

        if (error || !data) return null;

        const breakdown = { manual: 0, assisted: 0, autonomous: 0, total: data.length };
        for (const row of data) {
            breakdown[classifyExecutionSource(row.reasoning)]++;
        }
        return breakdown;
    } catch {
        return null;
    }
}
