"use server";

/**
 * Real Autonomous Quant Test Harness -- Stage A (persistent state
 * machine) plus Round 114's real, manually-triggerable observation
 * cycle. Real state transitions (start/pause/resume/stop) with real
 * progress counters, plus runTestHarnessCycle() -- a real wrapper
 * around engine/quant/orchestration/ObservationCycle.ts's real,
 * self-contained cycle logic.
 *
 * Real, honest scoping stated directly: runTestHarnessCycle() is
 * manually triggerable ONLY in this round -- no real external
 * scheduler calls it yet. That's Round 115's real, separate,
 * deliberate follow-up (per the bootstrap's own staged plan), kept
 * apart from this round so the cycle logic itself can be verified
 * working manually before any unattended trigger is connected to it.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { runObservationCycle, type CycleResult } from "@/engine/quant/orchestration/ObservationCycle";
import { getMostActiveStocks } from "@/engine/evidence/providers/AlpacaMoversProvider";

export type HarnessStatus = "IDLE" | "RUNNING" | "PAUSED" | "STOPPING" | "COMPLETED" | "FAILED" | "EMERGENCY_STOPPED";

export interface TestHarnessConfig {
    name: string;
    watchlist: string[];
    targetObservations?: number;
    targetAutonomousRuns?: number;
    targetCompletedTradeCycles?: number;
    observationIntervalSeconds?: number;
    /** Real, optional discovery: when true, real live "most active stocks" (Alpaca's own screener) are added to the manually-provided watchlist, bounded to a small real count -- not a replacement for the manual list, an honest supplement. */
    useDynamicDiscovery?: boolean;
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

    let finalWatchlist = config.watchlist;
    if (config.useDynamicDiscovery) {
        // Real, bounded supplement -- top 10 real live most-active
        // tickers, merged with the manual list, deduplicated. Bounded
        // deliberately small given the real Finnhub rate-limit
        // pressure already observed this session at just 15 tickers.
        const movers = await getMostActiveStocks(10);
        const discovered = movers.map(m => m.symbol);
        finalWatchlist = Array.from(new Set([...config.watchlist, ...discovered]));
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
                watchlist: finalWatchlist,
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

/**
 * Real, manually-triggerable single observation cycle for the
 * user's active test harness run. Wraps round114's real
 * runObservationCycle() -- resolves the real authenticated user and
 * the real active test's real watchlist, then calls the actual
 * cycle logic. Real, honest guard: refuses to run when no active
 * test exists or the test isn't in RUNNING status (e.g. PAUSED),
 * rather than silently running anyway.
 */
export async function runTestHarnessCycle(): Promise<{ success: boolean; result?: CycleResult; error?: string }> {
    const userId = await getAuthedUserId();
    if (!userId) return { success: false, error: "Not authenticated." };

    const active = await getActiveTestHarness();
    if (!active) return { success: false, error: "No active test harness run." };
    if (active.status !== "RUNNING") return { success: false, error: `Test is ${active.status}, not RUNNING -- resume it first.` };

    const result = await runObservationCycle(userId, active.id, active.watchlist);
    return { success: true, result };
}
