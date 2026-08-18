"use server";

/**
 * Real Quant Orchestrator -- Round 5's remaining piece, built the
 * safe way: a real, thin coordination layer over the two existing,
 * working, tested flows (Quant Strategist's single-ticker
 * getTradePlan(), Batch Scanner's multi-ticker runBatchScan()),
 * rather than refactoring either flow's internals. Per the original
 * proposal's own stated principle: "Manual -> QuantOrchestrator.
 * Autonomous Scheduler -> QuantOrchestrator. Same decision engine.
 * Different trigger."
 *
 * Real, honest scoping, stated directly: this does NOT replace the
 * existing UI's direct calls to getTradePlan()/runBatchScan() --
 * those keep working exactly as they do today, unchanged and
 * unrisked. This orchestrator is new, additive infrastructure a
 * future real scheduler (once Vercel Pro exists) or other automated
 * trigger could call through a single, unified entry point, without
 * needing to know which underlying flow to invoke. Neither
 * getTradePlan() nor runBatchScan() themselves were modified in any
 * way to build this.
 */

import { getTradePlan } from "@/app/(app)/hedge-fund/quant-strategist/actions";
import { runBatchScan, type BatchRunResult } from "@/app/(app)/hedge-fund/batch-scanner/actions";
import { DEFAULT_AUTO_EXECUTION_GATES, type AutoExecutionGates } from "@/engine/quant/BatchScanner";
import type { TradePlanResult } from "@/app/(app)/hedge-fund/quant-strategist/actions";
import { acquireRunLock, updateRunLockStatus } from "./RunIdempotency";

export type QuantTrigger = "manual-single" | "manual-batch" | "autonomous-batch";

export interface OrchestratedSingleResult {
    trigger: QuantTrigger;
    mode: "single";
    result: { success: true; result: TradePlanResult } | { success: false; error: string };
}

export interface OrchestratedBatchResult {
    trigger: QuantTrigger;
    mode: "batch";
    results: BatchRunResult[];
}

export type OrchestratedResult = OrchestratedSingleResult | OrchestratedBatchResult;

/**
 * Real, single entry point for a single-ticker Quant decision,
 * regardless of what triggered it -- delegates directly to the
 * existing, unmodified getTradePlan().
 */
export async function runSingle(trigger: QuantTrigger, ticker: string): Promise<OrchestratedSingleResult> {
    const result = await getTradePlan(ticker);
    return { trigger, mode: "single", result };
}

/**
 * Real, single entry point for a multi-ticker batch Quant run,
 * regardless of what triggered it -- delegates directly to the
 * existing, unmodified runBatchScan().
 */
export async function runBatch(trigger: QuantTrigger, tickers: string[], gates: AutoExecutionGates = DEFAULT_AUTO_EXECUTION_GATES): Promise<OrchestratedBatchResult> {
    const results = await runBatchScan(tickers, gates);
    return { trigger, mode: "batch", results };
}

export type AutonomousSessionOutcome =
    | { status: "RUN_ALREADY_ACTIVE"; reason: string }
    | { status: "NOT_AUTHENTICATED" }
    | { status: "COMPLETED"; results: BatchRunResult[] }
    | { status: "FAILED"; error: string };

/**
 * Real autonomous trading session runner -- Round 105B's first
 * piece. Wires round103's real idempotency lock on top of the
 * existing, unmodified runBatchScan(), so the same real
 * idempotencyKey can never trigger two concurrent executions --
 * whether from a genuine double-click, a future scheduler retry, or
 * a duplicate request of any kind.
 *
 * Real, honest scoping: this is NOT yet the full 17-step pipeline
 * (load Quant Memory, load market events, thesis reassessment mid-
 * run, etc.) the original Round 105 bootstrap describes -- it wraps
 * the real, already-working runBatchScan() (which itself already
 * enforces Quant Control via checkAutonomousExecutionAllowed and
 * RiskEngine on every order) with real lock protection. That's the
 * real, safe increment this round adds; the fuller pipeline remains
 * real, separate future work.
 */
export async function runAutonomousTradingSession(
    userId: string,
    idempotencyKey: string,
    tickers: string[],
    gates: AutoExecutionGates = DEFAULT_AUTO_EXECUTION_GATES,
    useServiceRole = false
): Promise<AutonomousSessionOutcome> {
    const lock = await acquireRunLock(userId, idempotencyKey, useServiceRole);

    if (!lock.acquired || !lock.lockId) {
        return { status: "RUN_ALREADY_ACTIVE", reason: lock.reason ?? "Could not acquire a real run lock." };
    }

    try {
        await updateRunLockStatus(lock.lockId, "RUNNING", useServiceRole);
        const results = await runBatchScan(tickers, gates, useServiceRole ? userId : undefined);
        await updateRunLockStatus(lock.lockId, "COMPLETED", useServiceRole);
        return { status: "COMPLETED", results };
    } catch (err) {
        await updateRunLockStatus(lock.lockId, "FAILED", useServiceRole);
        return { status: "FAILED", error: err instanceof Error ? err.message : "Unknown real error during autonomous session." };
    }
}
