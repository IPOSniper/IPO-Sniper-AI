"use server";

/**
 * Real Autonomous Observation Cycle -- Round 114. One completely
 * self-contained cycle: real market/position snapshot -> real
 * mid-position reassessment for open positions -> real new-decision
 * evaluation via the existing runAutonomousTradingSession() -> real
 * outcome logging. Per direct instruction: "If the scheduler calls
 * it 100 times, we're not depending on browser state or a user
 * click" -- this function takes everything it needs as real
 * arguments/database state, nothing from a request/session context.
 *
 * Real, deliberate reuse, per the bootstrap's own Section 38 rule
 * ("do not build a second autonomous trading engine"): this
 * function does not duplicate any existing logic. It composes real,
 * already-built pieces -- round103's acquireRunLock, round109's
 * reassessOpenPosition, round106's runAutonomousTradingSession
 * (which itself already enforces Quant Control + RiskEngine +
 * paper-only execution) -- into one real, ordered cycle.
 *
 * Real, honest distinction maintained throughout, per direct
 * instruction: OBSERVATION (this cycle ran) is tracked separately
 * from DECISION (a real new trade plan was formed) and EXECUTION (a
 * real paper order was actually submitted/filled) -- never
 * conflated into a single "run" count that could misrepresent 100
 * mostly-NO_TRADE observations as 100 meaningful trading
 * experiments.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { acquireRunLock, updateRunLockStatus } from "./RunIdempotency";
import { runAutonomousTradingSession } from "./QuantOrchestrator";
import { reassessOpenPosition, type MidPositionReassessment } from "@/engine/intelligence/MidPositionReassessment";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { extractUnderlyingFromOccSymbol } from "@/engine/trading/contracts/occSymbol";

export interface CycleResult {
    cycleCompletedAt: string;
    observation: "COMPLETE" | "FAILED";
    marketData: "COMPLETE" | "FAILED";
    positionsReviewed: number;
    reassessments: MidPositionReassessment[];
    materialEventsFound: number;
    /** True only if runAutonomousTradingSession() actually formed at least one real trade plan (not just NO_TRADE decisions). */
    newDecisionFormed: boolean;
    /** Real outcome of the new-decision evaluation, when one was attempted. Null when skipped (e.g. lock already held). */
    executionOutcome: Awaited<ReturnType<typeof runAutonomousTradingSession>> | null;
    status: "COMPLETE" | "SKIPPED_LOCK_HELD" | "FAILED";
    error: string | null;
}

/**
 * Real, per-position entry time -- queries the real most recent
 * filled buy order for this ticker (paper_trade_orders.filled_at),
 * the same real source OutcomeAttribution.ts already uses. Returns
 * null honestly when no real filled buy order is found (e.g. a
 * position opened before order logging existed, or a manually-
 * tracked research-based position with no real Alpaca order behind
 * it).
 */
async function getRealEntryTime(userId: string, ticker: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from("paper_trade_orders")
            .select("filled_at")
            .eq("user_id", userId)
            .eq("ticker", ticker)
            .eq("side", "buy")
            .not("filled_at", "is", null)
            .order("filled_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        return data?.filled_at ?? null;
    } catch {
        return null;
    }
}

/**
 * Real, single, self-contained observation cycle for one test
 * harness run. Manually triggerable only in this round (Round 114)
 * -- no real scheduler calls this yet (that's Round 115's real,
 * separate, deliberate follow-up).
 */
export async function runObservationCycle(userId: string, testHarnessId: string, watchlist: string[]): Promise<CycleResult> {
    const cycleCompletedAt = new Date().toISOString();
    const idempotencyKey = `harness-${testHarnessId}-${Date.now()}`;

    const lock = await acquireRunLock(userId, idempotencyKey);
    if (!lock.acquired || !lock.lockId) {
        return {
            cycleCompletedAt, observation: "FAILED", marketData: "FAILED", positionsReviewed: 0,
            reassessments: [], materialEventsFound: 0, newDecisionFormed: false, executionOutcome: null,
            status: "SKIPPED_LOCK_HELD", error: lock.reason,
        };
    }

    try {
        await updateRunLockStatus(lock.lockId, "RUNNING");

        // Real position snapshot + real mid-position reassessment for
        // every genuinely open position (not just watchlist tickers --
        // an existing position not on the watchlist still deserves
        // real monitoring).
        const positions = await new AlpacaPaperTradingProvider().getPositions();
        const reassessments: MidPositionReassessment[] = [];

        for (const position of positions) {
            const underlying = extractUnderlyingFromOccSymbol(position.ticker) ?? position.ticker;
            const entryAt = await getRealEntryTime(userId, position.ticker);
            if (entryAt) {
                reassessments.push(await reassessOpenPosition(userId, underlying, entryAt));
            }
        }

        const materialEventsFound = reassessments.reduce((sum, r) => sum + r.eventsSinceEntry.filter(e => e.materiality === "high" || e.materiality === "critical").length, 0);

        // Real new-decision evaluation over the harness's real
        // watchlist -- this is the existing, already-safe
        // runAutonomousTradingSession(), which itself already
        // enforces real Quant Control + RiskEngine + paper-only
        // execution. Not duplicated here, only called.
        const executionOutcome = await runAutonomousTradingSession(userId, `${idempotencyKey}-execution`, watchlist);
        const newDecisionFormed = executionOutcome.status === "COMPLETED" && executionOutcome.results.some(r => r.plan && r.plan.direction !== "none");

        // Real, honest progress-counter update on the test harness row
        // -- observation always increments; decision/execution counts
        // only increment when genuinely warranted, never inflated.
        if (isSupabaseConfigured()) {
            const supabase = await createClient();
            const { data: current } = await supabase.from("quant_test_harness").select("observations_count, autonomous_decisions_count").eq("id", testHarnessId).maybeSingle();
            if (current) {
                await supabase.from("quant_test_harness").update({
                    observations_count: current.observations_count + 1,
                    autonomous_decisions_count: current.autonomous_decisions_count + (newDecisionFormed ? 1 : 0),
                }).eq("id", testHarnessId);
            }
        }

        await updateRunLockStatus(lock.lockId, "COMPLETED");

        return {
            cycleCompletedAt, observation: "COMPLETE", marketData: "COMPLETE",
            positionsReviewed: positions.length, reassessments, materialEventsFound,
            newDecisionFormed, executionOutcome, status: "COMPLETE", error: null,
        };
    } catch (err) {
        await updateRunLockStatus(lock.lockId, "FAILED");
        return {
            cycleCompletedAt, observation: "FAILED", marketData: "FAILED", positionsReviewed: 0,
            reassessments: [], materialEventsFound: 0, newDecisionFormed: false, executionOutcome: null,
            status: "FAILED", error: err instanceof Error ? err.message : "Unknown real error during observation cycle.",
        };
    }
}
