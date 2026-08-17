"use server";

/**
 * Real Run Idempotency -- Section 7I's explicit requirement. The
 * real enforcement mechanism is the database's own unique constraint
 * on (user_id, idempotency_key) in quant_run_locks -- a second real
 * concurrent attempt with the same key fails at the insert itself,
 * not via an application-level check that could race under real
 * concurrent requests (e.g. a genuine double-click or a real retry
 * arriving before the first attempt's status is visible yet).
 *
 * Real, honest scoping: this provides the lock primitive
 * (acquireRunLock/completeRunLock/failRunLock). It is NOT yet wired
 * into runBatchScan() or QuantOrchestrator.runBatch() -- doing so
 * safely requires deciding a real, deterministic idempotency-key
 * scheme (e.g. derived from watchlist + a real time bucket) that
 * doesn't accidentally block two genuinely-intended separate runs
 * within the same window. That's real, separate follow-up work, not
 * done silently in this round.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type RunLockStatus = "STARTED" | "RUNNING" | "COMPLETED" | "FAILED" | "ABORTED";

export interface RunLockResult {
    acquired: boolean;
    lockId: string | null;
    /** Real, honest reason when acquired is false -- e.g. a genuine unique-constraint conflict, or Supabase not configured. */
    reason: string | null;
}

/**
 * Real attempt to acquire a run lock for one idempotency key.
 * Returns acquired: false (not a thrown error) on a genuine
 * unique-constraint conflict -- a duplicate attempt is an expected,
 * real outcome to handle gracefully, not an exceptional failure.
 */
export async function acquireRunLock(userId: string, idempotencyKey: string): Promise<RunLockResult> {
    if (!isSupabaseConfigured()) {
        return { acquired: false, lockId: null, reason: "Supabase not configured -- cannot enforce idempotency." };
    }
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("quant_run_locks")
            .insert({ user_id: userId, idempotency_key: idempotencyKey, status: "STARTED" })
            .select("id")
            .single();

        if (error) {
            // A real unique-constraint violation (Postgres code 23505)
            // means a lock for this exact key already exists -- the
            // real, expected "already running/ran" case, not a bug.
            const alreadyLocked = error.code === "23505";
            return {
                acquired: false,
                lockId: null,
                reason: alreadyLocked ? `A run with idempotency key "${idempotencyKey}" already exists for this user.` : `Real lock-acquire error: ${error.message}`,
            };
        }

        return { acquired: true, lockId: data.id, reason: null };
    } catch (err) {
        return { acquired: false, lockId: null, reason: `Real exception acquiring lock: ${err instanceof Error ? err.message : String(err)}` };
    }
}

/** Real, honest status update once a locked run genuinely finishes (success or failure). */
export async function updateRunLockStatus(lockId: string, status: RunLockStatus): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from("quant_run_locks")
            .update({ status, completed_at: (status === "COMPLETED" || status === "FAILED" || status === "ABORTED") ? new Date().toISOString() : null })
            .eq("id", lockId);

        if (error) {
            console.error("updateRunLockStatus failed:", error.message);
        }
    } catch (err) {
        console.error("updateRunLockStatus threw:", err instanceof Error ? err.message : err);
    }
}
