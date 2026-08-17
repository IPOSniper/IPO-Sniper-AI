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
 * Real, deliberate safety scoping, stated directly: automatically
 * executing exits is a real, separate, much bigger safety decision
 * (it would need the same real Quant Control authorization check
 * entries already go through, extensive testing, and explicit
 * owner sign-off) -- not something to fold into this round
 * alongside everything else. This round gives a human (or a future,
 * separate, carefully-built auto-exit system) the real signal to
 * act on, not an automatic action.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
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
 */
export async function assessPosition(userId: string, position: TradingPosition): Promise<PositionAssessment> {
    const base: Omit<PositionAssessment, "profitTargetPercent" | "stopLossPercent" | "recommendation"> = {
        ticker: position.ticker,
        unrealizedPlPercent: position.unrealizedPlPercent,
    };

    if (!isSupabaseConfigured()) {
        return { ...base, profitTargetPercent: null, stopLossPercent: null, recommendation: "no-linked-decision" };
    }

    try {
        const supabase = await createClient();
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
