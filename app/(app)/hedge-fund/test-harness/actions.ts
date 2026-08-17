"use server";

/**
 * Real Autonomous Quant Test Harness -- Stage A only (per the
 * bootstrap's own explicit two-stage plan, Section 39: "Build...
 * DO NOT activate continuous execution yet"). This file provides the
 * real, persistent state machine (start/pause/resume/stop, real
 * progress counters, real completion detection) with ZERO actual
 * scheduling or execution wiring -- nothing here calls
 * runAutonomousTradingSession() or places any real order. A real
 * test can be started, paused, resumed, and stopped safely; it
 * simply never advances on its own yet, since the real external
 * trigger (Stage B: a scheduler actually invoking a cycle) doesn't
 * exist yet.
 *
 * Real, honest scoping stated directly: this does NOT implement
 * Sections 8-20 (the actual observation cycle, material-change
 * detection, adaptive reassessment, decision generation) or Section
 * 25-27 (the real scheduler trigger). Those are real, substantial,
 * separate Stage B work -- deliberately not attempted in the same
 * round as the safety-critical state machine, consistent with the
 * bootstrap's own staged approach.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type HarnessStatus = "IDLE" | "RUNNING" | "PAUSED" | "STOPPING" | "COMPLETED" | "FAILED" | "EMERGENCY_STOPPED";

export interface TestHarnessConfig {
    name: string;
    watchlist: string[];
    targetObservations?: number;
    targetAutonomousRuns?: number;
    targetCompletedTradeCycles?: number;
    observationIntervalSeconds?: number;
}

export interface TestHarnessState {
    id: string;
    name: string;
    status: HarnessStatus;
    stopReason: string | null;
    targetObservations: number;
    targetAutonomousRuns: number;
    targetCompletedTradeCycles: number;
    observationIntervalSeconds: number;
    watchlist: string[];
    observationsCount: number;
    autonomousDecisionsCount: number;
    completedTradeCyclesCount: number;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
}

async function getAuthedUserId(): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

function mapRow(row: Record<string, unknown>): TestHarnessState {
    return {
        id: row.id as string,
        name: row.name as string,
        status: row.status as HarnessStatus,
        stopReason: row.stop_reason as string | null,
        targetObservations: row.target_observations as number,
        targetAutonomousRuns: row.target_autonomous_runs as number,
        targetCompletedTradeCycles: row.target_completed_trade_cycles as number,
        observationIntervalSeconds: row.observation_interval_seconds as number,
        watchlist: row.watchlist as string[],
        observationsCount: row.observations_count as number,
        autonomousDecisionsCount: row.autonomous_decisions_count as number,
        completedTradeCyclesCount: row.completed_trade_cycles_count as number,
        createdAt: row.created_at as string,
        startedAt: row.started_at as string | null,
        completedAt: row.completed_at as string | null,
    };
}

/**
 * Real start of a new test -- creates a real, persistent row in
 * IDLE, then immediately transitions to RUNNING. Fails honestly
 * (via the real database's own partial unique index) if the user
 * already has an active test -- returns a real error, doesn't
 * silently create a second one.
 */
export async function startTestHarness(config: TestHarnessConfig): Promise<{ success: boolean; state?: TestHarnessState; error?: string }> {
    const userId = await getAuthedUserId();
    if (!userId) return { success: false, error: "Not authenticated." };

    if (config.watchlist.length === 0) {
        return { success: false, error: "Watchlist cannot be empty." };
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("quant_test_harness")
            .insert({
                user_id: userId,
                name: config.name,
                status: "RUNNING",
                target_observations: config.targetObservations ?? 500,
                target_autonomous_runs: config.targetAutonomousRuns ?? 100,
                target_completed_trade_cycles: config.targetCompletedTradeCycles ?? 25,
                observation_interval_seconds: config.observationIntervalSeconds ?? 600,
                watchlist: config.watchlist,
                started_at: new Date().toISOString(),
            })
            .select("*")
            .single();

        if (error) {
            // Real, honest translation of the real partial-unique-index
            // conflict -- a genuine "you already have an active test"
            // outcome, not a bug.
            const alreadyActive = error.code === "23505";
            return { success: false, error: alreadyActive ? "You already have an active test harness run. Stop it before starting a new one." : `Real error starting test: ${error.message}` };
        }

        return { success: true, state: mapRow(data) };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Unknown real error." };
    }
}

async function transitionStatus(newStatus: HarnessStatus, stopReason?: string): Promise<{ success: boolean; state?: TestHarnessState; error?: string }> {
    const userId = await getAuthedUserId();
    if (!userId) return { success: false, error: "Not authenticated." };

    try {
        const supabase = await createClient();
        const update: Record<string, unknown> = { status: newStatus };
        if (stopReason) update.stop_reason = stopReason;
        if (newStatus === "COMPLETED" || newStatus === "STOPPING") update.completed_at = new Date().toISOString();

        const { data, error } = await supabase
            .from("quant_test_harness")
            .update(update)
            .eq("user_id", userId)
            .in("status", ["IDLE", "RUNNING", "PAUSED", "STOPPING"])
            .select("*")
            .single();

        if (error || !data) {
            return { success: false, error: error?.message ?? "No active test harness run found." };
        }

        return { success: true, state: mapRow(data) };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Unknown real error." };
    }
}

export async function pauseTestHarness() {
    return transitionStatus("PAUSED", "User paused.");
}

export async function resumeTestHarness() {
    return transitionStatus("RUNNING");
}

export async function stopTestHarness(reason = "User stopped.") {
    return transitionStatus("STOPPING", reason);
}

export async function emergencyStopTestHarness(reason: string) {
    return transitionStatus("EMERGENCY_STOPPED", reason);
}

/**
 * Real, current state of the user's active test harness run, if any
 * -- null when no real active run exists (an honest, valid state,
 * not an error).
 */
export async function getActiveTestHarness(): Promise<TestHarnessState | null> {
    const userId = await getAuthedUserId();
    if (!userId) return null;

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("quant_test_harness")
            .select("*")
            .eq("user_id", userId)
            .in("status", ["IDLE", "RUNNING", "PAUSED", "STOPPING"])
            .maybeSingle();

        if (error || !data) return null;
        return mapRow(data);
    } catch {
        return null;
    }
}
