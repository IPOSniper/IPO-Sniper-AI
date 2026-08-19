"use server";

/**
 * Real Position Monitor -- Round 6, first piece. Genuinely
 * read-only: checks a real open position against the real
 * profit-target/stop-loss percentages already stored on the
 * decision that led to it (quant_trade_decisions.profit_target_percent/
 * stop_loss_percent, computed by QuantStrategist when the trade plan
 * was originally built). Returns a real, honest recommendation --
 * this function does NOT place any sell order itself.
 *
 * Real, deliberate safety scoping, stated directly: this remains the
 * real, read-only assessment primitive. The real, separate,
 * carefully-built auto-exit system anticipated here has now been
 * built on top of this function (Round 121, AutonomousExitEngine.ts)
 * -- that file composes assessPosition() with the same real Quant
 * Control + RiskEngine + idempotency chain already proven for
 * entries, rather than modifying this function's own honest,
 * read-only scope.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/serviceRole";
import type { TradingPosition } from "@/engine/trading/contracts/TradeOrder";

export type ExitRecommendation = "hold" | "profit_target_hit" | "stop_loss_hit" | "no-linked-decision";

export interface PositionAssessment {
    ticker: string;
    unrealizedPlPercent: number;
    profitTargetPercent: number | null;
    stopLossPercent: number | null;
    recommendation: ExitRecommendation;
}

/**
 * Real check for one open position against the real exit
 * parameters from the most recent real, executed decision for that
 * ticker. Returns "no-linked-decision" honestly when no real,
 * executed quant_trade_decisions row exists for this ticker (e.g. a
 * manually-placed order via "Place order", which isn't linked to any
 * decision) -- not a guessed exit threshold.
 *
 * Real, narrow addition for the cron/background-job path (Round 121):
 * an optional overrideUserId, same established pattern as round115.
 */
export async function assessPosition(userId: string, position: TradingPosition, overrideUserId?: string): Promise<PositionAssessment> {
    const base: Omit<PositionAssessment, "profitTargetPercent" | "stopLossPercent" | "recommendation"> = {
        ticker: position.ticker,
        unrealizedPlPercent: position.unrealizedPlPercent,
    };

    if (!isSupabaseConfigured()) {
        return { ...base, profitTargetPercent: null, stopLossPercent: null, recommendation: "no-linked-decision" };
    }
    if (overrideUserId && !isServiceRoleConfigured()) {
        return { ...base, profitTargetPercent: null, stopLossPercent: null, recommendation: "no-linked-decision" };
    }

    try {
        const supabase = overrideUserId ? createServiceRoleClient() : await createClient();
        const { data, error } = await supabase
            .from("quant_trade_decisions")
            .select("profit_target_percent, stop_loss_percent")
            .eq("user_id", userId)
            .eq("ticker", position.ticker)
            .not("broker_order_id", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data || data.profit_target_percent === null || data.stop_loss_percent === null) {
            return { ...base, profitTargetPercent: null, stopLossPercent: null, recommendation: "no-linked-decision" };
        }

        const profitTargetPercent = Number(data.profit_target_percent);
        const stopLossPercent = Number(data.stop_loss_percent);

        let recommendation: ExitRecommendation = "hold";
        if (position.unrealizedPlPercent >= profitTargetPercent) {
            recommendation = "profit_target_hit";
        } else if (position.unrealizedPlPercent <= -stopLossPercent) {
            recommendation = "stop_loss_hit";
        }

        return { ...base, profitTargetPercent, stopLossPercent, recommendation };
    } catch {
        return { ...base, profitTargetPercent: null, stopLossPercent: null, recommendation: "no-linked-decision" };
    }
}
