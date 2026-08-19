"use server";

/**
 * Real Autonomous Exit Engine -- Round 121's identified "missing
 * link." Composes round102's real, read-only assessPosition() with
 * the same real Quant Control + RiskEngine + idempotency chain
 * already proven for autonomous entries (round106/round115), giving
 * Quant the ability to independently close an existing paper
 * position -- not just open new ones.
 *
 * Real, deliberate, narrow trigger, stated directly: only two real,
 * objective, non-AI-judgment signals authorize an autonomous exit --
 * assessPosition()'s real "profit_target_hit" or "stop_loss_hit"
 * recommendation, computed from the real profit-target/stop-loss
 * percentages the original entry decision itself already specified.
 * This is deliberately NOT a subjective "thesis feels weaker now"
 * exit -- that remains MidPositionReassessment's real, honest,
 * read-only signal (round109), not an autonomous trigger here. A
 * position with "hold" or "no-linked-decision" (e.g. a manually-
 * placed order with no real profit/stop parameters attached) is
 * correctly left alone.
 *
 * Real safety chain, same as entries, per direct instruction not to
 * bypass any of it: Quant Control (AUTONOMOUS required) -> real
 * idempotency lock (prevents a double-exit from an overlapping
 * cycle) -> placeOrder() itself (which already enforces RiskEngine,
 * contract validation for options, and real audit logging) ->
 * Alpaca paper. No new bypass of any existing gate.
 */

import { checkAutonomousExecutionAllowed } from "@/app/(app)/hedge-fund/quant-control/actions";
import { assessPosition } from "./PositionMonitor";
import { placeOrder } from "@/app/(app)/hedge-fund/paper-trading/actions";
import { acquireRunLock, updateRunLockStatus } from "./RunIdempotency";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { extractUnderlyingFromOccSymbol } from "@/engine/trading/contracts/occSymbol";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { TradingPosition } from "@/engine/trading/contracts/TradeOrder";

export interface ExitOutcome {
    ticker: string;
    recommendation: "profit_target_hit" | "stop_loss_hit" | "hold" | "no-linked-decision";
    action: "SUBMITTED" | "SKIPPED_NOT_AUTONOMOUS" | "SKIPPED_LOCK_HELD" | "SKIPPED_NO_TRIGGER" | "FAILED";
    orderId: string | null;
    error: string | null;
}

/**
 * Real, single-position exit evaluation and, if genuinely warranted,
 * real submission. Every real position gets its own real
 * idempotency key, so one position's lock never blocks evaluation
 * of another.
 */
/**
 * Real, critical safety check -- per direct instruction: "the
 * scheduler runs while an exit order is pending. Quant must not
 * submit another exit." A time-varying idempotency key alone
 * (Date.now()-based, as originally built) only prevents duplicate
 * submission WITHIN one cycle invocation -- it does NOT prevent a
 * second, separate scheduler cycle (e.g. ~10 minutes later) from
 * submitting a second sell for the same still-open position if the
 * first sell hasn't filled yet. This checks the real,
 * already-persisted paper_trade_orders for a real, recent sell
 * attempt on this exact ticker before allowing another.
 *
 * Real, deliberately generous window (30 minutes -- 3x the normal
 * ~10min cycle cadence): catches a pending/slow-filling order across
 * several consecutive cycles, not just the immediately-prior one.
 */
async function hasRecentPendingSell(userId: string, ticker: string, useServiceRole: boolean): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
        const supabase = useServiceRole ? createServiceRoleClient() : await createClient();
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        const { data } = await supabase
            .from("paper_trade_orders")
            .select("id, broker_order_id, filled_at")
            .eq("user_id", userId)
            .eq("ticker", ticker)
            .eq("side", "sell")
            .not("broker_order_id", "is", null)
            .gt("created_at", thirtyMinutesAgo)
            .limit(1);

        // A real, recent, actually-submitted (broker_order_id set)
        // sell exists -- regardless of whether it's filled yet.
        // Waiting for it to resolve (fill or genuinely disappear from
        // real open positions) is the safe, correct behavior.
        return Boolean(data && data.length > 0);
    } catch {
        // Real, honest fail-safe: if this check itself fails, do NOT
        // assume it's safe to sell -- treat an unknown state as "a
        // recent sell might exist," which blocks the new submission.
        // A missed exit opportunity for one cycle is a far smaller
        // real cost than a genuine duplicate sell order.
        return true;
    }
}

async function evaluateAndExitOne(userId: string, position: TradingPosition, idempotencyKeyBase: string, useServiceRole: boolean): Promise<ExitOutcome> {
    const assessment = await assessPosition(userId, position, useServiceRole ? userId : undefined);

    if (assessment.recommendation !== "profit_target_hit" && assessment.recommendation !== "stop_loss_hit") {
        return { ticker: position.ticker, recommendation: assessment.recommendation, action: "SKIPPED_NO_TRIGGER", orderId: null, error: null };
    }

    const control = await checkAutonomousExecutionAllowed("autonomous", useServiceRole ? userId : undefined);
    if (!control.allowed) {
        return { ticker: position.ticker, recommendation: assessment.recommendation, action: "SKIPPED_NOT_AUTONOMOUS", orderId: null, error: control.reason };
    }

    // Real, critical check -- catches what the per-cycle idempotency
    // lock below cannot: a real sell already submitted by an EARLIER
    // cycle that hasn't filled/resolved yet. Without this, a
    // Date.now()-based idempotency key is unique per cycle and would
    // not stop a second, separate scheduler invocation from
    // submitting a second sell for the same still-open position.
    if (await hasRecentPendingSell(userId, position.ticker, useServiceRole)) {
        return { ticker: position.ticker, recommendation: assessment.recommendation, action: "SKIPPED_LOCK_HELD", orderId: null, error: "A real sell order for this ticker was already submitted within the last 30 minutes -- waiting for it to resolve before considering another." };
    }

    const idempotencyKey = `${idempotencyKeyBase}-exit-${position.ticker}`;
    const lock = await acquireRunLock(userId, idempotencyKey, useServiceRole);
    if (!lock.acquired || !lock.lockId) {
        return { ticker: position.ticker, recommendation: assessment.recommendation, action: "SKIPPED_LOCK_HELD", orderId: null, error: lock.reason };
    }

    try {
        await updateRunLockStatus(lock.lockId, "RUNNING", useServiceRole);

        const underlying = extractUnderlyingFromOccSymbol(position.ticker);
        const assetType = underlying ? "option" : "equity";
        const reasoning = `Autonomous exit -- ${assessment.recommendation} (unrealized ${assessment.unrealizedPlPercent.toFixed(1)}%, target ${assessment.profitTargetPercent}%, stop ${assessment.stopLossPercent}%).`;

        const result = await placeOrder(
            position.ticker,
            "sell",
            position.qty,
            reasoning,
            undefined,
            assetType,
            underlying ?? undefined,
            useServiceRole ? userId : undefined
        );

        await updateRunLockStatus(lock.lockId, result.success ? "COMPLETED" : "FAILED", useServiceRole);

        if (!result.success) {
            return { ticker: position.ticker, recommendation: assessment.recommendation, action: "FAILED", orderId: null, error: result.error ?? "Unknown real order failure." };
        }

        return { ticker: position.ticker, recommendation: assessment.recommendation, action: "SUBMITTED", orderId: result.order?.brokerOrderId ?? null, error: null };
    } catch (err) {
        await updateRunLockStatus(lock.lockId, "FAILED", useServiceRole);
        return { ticker: position.ticker, recommendation: assessment.recommendation, action: "FAILED", orderId: null, error: err instanceof Error ? err.message : "Unknown real exception." };
    }
}

/**
 * Real, top-level entry point: evaluates every real open position
 * for a genuine, objective exit trigger, and submits real sell
 * orders for the ones that qualify. Real, honest: a cycle with zero
 * qualifying exits returns an empty-outcome array for those
 * positions (SKIPPED_NO_TRIGGER), not a fabricated action.
 */
export async function runAutonomousExitCheck(userId: string, idempotencyKeyBase: string, useServiceRole = false): Promise<ExitOutcome[]> {
    const positions = await new AlpacaPaperTradingProvider().getPositions();
    const outcomes: ExitOutcome[] = [];

    for (const position of positions) {
        outcomes.push(await evaluateAndExitOne(userId, position, idempotencyKeyBase, useServiceRole));
    }

    return outcomes;
}
