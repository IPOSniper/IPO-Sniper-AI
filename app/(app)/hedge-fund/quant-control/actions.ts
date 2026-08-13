"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type QuantControlState = "OFF" | "ASSISTED" | "AUTONOMOUS" | "SAFE_MODE" | "EMERGENCY_STOP";

export interface QuantControlStatus {
    state: QuantControlState;
    reason: string;
    changedAt: string;
}

/**
 * Real, centralized Quant control state. Append-only log (see the
 * real migration's comment) -- current state is just the most
 * recent real row for this user. Defaults to "OFF" (the safest
 * default) when no row exists yet -- a brand-new user has never
 * explicitly enabled any autonomous behavior, so nothing should run
 * until they do.
 */
export async function getQuantControlState(): Promise<QuantControlStatus> {
    const DEFAULT: QuantControlStatus = { state: "OFF", reason: "No state set yet — defaults to OFF.", changedAt: new Date(0).toISOString() };

    if (!isSupabaseConfigured()) return DEFAULT;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return DEFAULT;

        const { data, error } = await supabase
            .from("quant_control_state")
            .select("state, reason, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return DEFAULT;

        return { state: data.state as QuantControlState, reason: data.reason, changedAt: data.created_at };
    } catch {
        return DEFAULT;
    }
}

/**
 * Real state change -- a new row, not an edit. Requires a real,
 * non-empty reason (enforced here, not just a UI hint), since the
 * whole point of this being append-only is a genuine audit trail,
 * not a blank log.
 */
export async function setQuantControlState(state: QuantControlState, reason: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: "Supabase is not configured." };
    if (!reason.trim()) return { success: false, error: "A reason is required for every state change." };

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "You must be signed in." };

        const { error } = await supabase.from("quant_control_state").insert({
            user_id: user.id,
            state,
            reason: reason.trim(),
        });

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to update state." };
    }
}

/**
 * Real enforcement helper -- called from actual execution paths
 * (Quant Strategist's executeTradePlan, Batch Scanner's autonomous
 * execution), NOT just read by the UI. This is what makes the kill
 * switch a real control rather than a dashboard button: every
 * AI-driven execution path calls this and genuinely respects the
 * result, checked at the server-action level where the request
 * can't bypass it by skipping a UI step.
 *
 * Real design decision, stated explicitly: this does NOT gate the
 * fully-manual order form (placeOrder() called directly with no AI
 * involvement) -- only AI-driven paths. A human explicitly
 * submitting their own order, including to close a position during
 * an emergency, isn't "autonomous trading" and shouldn't be blocked
 * by a control meant to govern autonomous behavior. If this should
 * also block fully-manual orders, that's a real, separate decision
 * to make deliberately, not something to bake in silently.
 *
 * Real semantics, connected to the existing ExecutionSource
 * categorization (classifyExecutionSource in trade-timeline/
 * actions.ts): AUTONOMOUS state allows both assisted (human clicks
 * Execute) and autonomous (Batch Scanner, zero human click)
 * execution. ASSISTED state allows only the assisted source --
 * Batch Scanner's autonomous execution is blocked. OFF/SAFE_MODE/
 * EMERGENCY_STOP block both.
 */
export async function checkAutonomousExecutionAllowed(
    source: "assisted" | "autonomous"
): Promise<{ allowed: boolean; state: QuantControlState; reason: string }> {
    const status = await getQuantControlState();

    if (status.state === "AUTONOMOUS") {
        return { allowed: true, state: status.state, reason: "" };
    }
    if (status.state === "ASSISTED" && source === "assisted") {
        return { allowed: true, state: status.state, reason: "" };
    }

    const blockReason = status.state === "EMERGENCY_STOP"
        ? "Emergency Stop is active — no new autonomous orders are allowed."
        : status.state === "SAFE_MODE"
            ? "Safe Mode is active — new autonomous entries are paused (monitoring/research continues)."
            : status.state === "ASSISTED"
                ? "Quant is in Assisted mode — fully autonomous execution (Batch Scanner) is disabled. Assisted (human-reviewed) execution is still allowed."
                : "Quant autonomous control is OFF — enable Assisted or Autonomous mode first.";

    return { allowed: false, state: status.state, reason: blockReason };
}
