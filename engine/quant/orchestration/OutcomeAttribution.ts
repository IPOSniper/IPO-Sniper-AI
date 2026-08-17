"use server";

/**
 * Real Outcome Attribution -- Round 6/104, the actual real
 * learning-loop foundation. Given a real closed trade, finds the
 * EXACT real decision that produced it via a precise, real link
 * (matching the exact filled order first, by its unique real
 * filled_avg_price + filled_at + ticker, then that order's real
 * broker_order_id against the exact decision that generated it) --
 * not a "most recent decision for this ticker" guess, which the
 * Round 104 bootstrap correctly identified as a real weakness when
 * multiple trades exist for the same ticker (round102's original
 * version had exactly this imprecision, fixed here).
 *
 * Real, honest scoping: this is a real, simple calibration check
 * (was Quant's confidence well-founded, overconfident, or
 * underconfident), not the full "was the thesis correct / was
 * timing correct / was strategy selection correct" breakdown the
 * original proposal eventually wants. That fuller breakdown needs
 * the real event/materiality context this trade was made under
 * (round86-92's MarketEvent data), which isn't wired into this
 * comparison yet -- real, separate, later work.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ClosedTrade } from "@/engine/trading/lifecycle/PositionLifecycle";

export type CalibrationResult = "well-calibrated" | "overconfident" | "underconfident" | "no-linked-decision";

export interface OutcomeAttributionResult {
    ticker: string;
    returnPct: number;
    tradeQualityScore: number | null;
    calibration: CalibrationResult;
}

/** Real, stated thresholds -- a "high" quality score paired with a real loss, or a "low" one paired with a real gain, both count as miscalibration. Adjustable, not claimed as the only correct cutoffs. */
const HIGH_QUALITY_THRESHOLD = 80;
const LOW_QUALITY_THRESHOLD = 50;

/**
 * Real attribution for one real closed trade -- finds the EXACT real
 * decision responsible for it via a precise, real link (not a
 * ticker+time-proximity guess) and checks whether Quant's own real
 * confidence at the time was well-founded.
 */
export async function attributeOutcome(userId: string, closedTrade: ClosedTrade): Promise<OutcomeAttributionResult> {
    const base = { ticker: closedTrade.ticker, returnPct: closedTrade.returnPct };

    if (!isSupabaseConfigured()) {
        return { ...base, tradeQualityScore: null, calibration: "no-linked-decision" };
    }

    try {
        const supabase = await createClient();

        // Step 1: find the EXACT real entry order this closed trade's
        // FIFO match came from -- its real filled_avg_price and
        // filled_at are unique to that specific order, not just
        // "some order for this ticker."
        const { data: orderRow, error: orderError } = await supabase
            .from("paper_trade_orders")
            .select("broker_order_id")
            .eq("user_id", userId)
            .eq("ticker", closedTrade.ticker)
            .eq("side", "buy")
            .eq("filled_avg_price", closedTrade.entryPrice)
            .eq("filled_at", closedTrade.entryAt)
            .not("broker_order_id", "is", null)
            .limit(1)
            .maybeSingle();

        if (orderError || !orderRow || !orderRow.broker_order_id) {
            return { ...base, tradeQualityScore: null, calibration: "no-linked-decision" };
        }

        // Step 2: find the exact decision that produced that exact
        // order, via the real shared broker_order_id.
        const { data, error } = await supabase
            .from("quant_trade_decisions")
            .select("trade_quality_score")
            .eq("user_id", userId)
            .eq("broker_order_id", orderRow.broker_order_id)
            .maybeSingle();

        if (error || !data) {
            return { ...base, tradeQualityScore: null, calibration: "no-linked-decision" };
        }

        const tradeQualityScore = Number(data.trade_quality_score);
        let calibration: CalibrationResult = "well-calibrated";

        if (tradeQualityScore >= HIGH_QUALITY_THRESHOLD && closedTrade.returnPct < 0) {
            calibration = "overconfident";
        } else if (tradeQualityScore <= LOW_QUALITY_THRESHOLD && closedTrade.returnPct > 0) {
            calibration = "underconfident";
        }

        return { ...base, tradeQualityScore, calibration };
    } catch {
        return { ...base, tradeQualityScore: null, calibration: "no-linked-decision" };
    }
}
