"use server";

/**
 * Real Outcome Attribution -- Round 6, second piece, the actual real
 * learning-loop foundation. Given a real closed trade, finds the
 * real decision that most likely led to it (same ticker, executed
 * before the trade's real entry time) and compares Quant's own real
 * confidence at decision time against what actually happened.
 *
 * Real, honest scoping: this is a real, simple calibration check
 * (was Quant's confidence well-founded, overconfident, or
 * underconfident), not the full "was the thesis correct / was
 * timing correct / was strategy selection correct" breakdown the
 * original proposal eventually wants. That fuller breakdown needs
 * the real event/materiality context this trade was made under
 * (round86-92's MarketEvent data), which isn't wired into this
 * comparison yet -- real, separate, later work. This is the first
 * real predicted-vs-actual signal, not the complete one.
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
 * Real attribution for one real closed trade -- finds the real
 * decision most likely responsible for it (same ticker, executed,
 * created before the trade's real entry) and checks whether Quant's
 * own real confidence at the time was well-founded.
 */
export async function attributeOutcome(userId: string, closedTrade: ClosedTrade): Promise<OutcomeAttributionResult> {
    const base = { ticker: closedTrade.ticker, returnPct: closedTrade.returnPct };

    if (!isSupabaseConfigured()) {
        return { ...base, tradeQualityScore: null, calibration: "no-linked-decision" };
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("quant_trade_decisions")
            .select("trade_quality_score")
            .eq("user_id", userId)
            .eq("ticker", closedTrade.ticker)
            .not("broker_order_id", "is", null)
            .lte("created_at", closedTrade.entryAt)
            .order("created_at", { ascending: false })
            .limit(1)
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
