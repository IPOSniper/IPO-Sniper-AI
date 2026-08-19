import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/serviceRole";
import { runObservationCycle } from "@/engine/quant/orchestration/ObservationCycle";
import { isMarketOpen } from "@/engine/quant/orchestration/MarketHours";

/**
 * Real, narrow cron execution path for Round 115 -- the actual
 * unattended trigger for the Autonomous Quant Test Harness. Reuses
 * the exact same real auth pattern already established for
 * /api/cron/overnight-watch (CRON_SECRET, Bearer token), same real
 * env var, not a new secret.
 *
 * Real, deliberately narrow scope, per direct instruction: this
 * route can ONLY do one thing -- find the single real RUNNING+PAPER
 * test harness and execute exactly ONE real observation cycle. It
 * cannot accept arbitrary user/ticker/order/quantity parameters --
 * there is no request body it reads at all. Every real safety gate
 * inside runObservationCycle -> runAutonomousTradingSession ->
 * runBatchScan (Quant Control, RiskEngine, paper-only verification,
 * position/risk limits, contract validation, kill switch,
 * idempotency) remains fully active and untouched -- this route's
 * only real job is providing authenticated database access for a
 * trusted background process, per direct instruction: "I'm an
 * authorized background process. Give me access to the private
 * Quant database. It must not say: I'm a background process,
 * therefore I can trade regardless of the normal controls."
 *
 * Given this app is single-owner (round84's lockdown -- signups
 * closed, only one real user can ever exist), finding "the" real
 * active test harness across all users is safe and unambiguous, not
 * a real multi-tenant risk.
 */
export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        return NextResponse.json({ success: false, error: "CRON_SECRET is not configured." }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    if (!isServiceRoleConfigured()) {
        return NextResponse.json({ success: false, error: "Service role not configured." }, { status: 500 });
    }

    if (!isMarketOpen()) {
        return NextResponse.json({ success: true, skipped: true, reason: "Market is closed (real NYSE/NASDAQ standard-hours check, holidays not yet accounted for)." });
    }

    try {
        const supabase = createServiceRoleClient();
        const { data: activeTest, error } = await supabase
            .from("quant_test_harness")
            .select("id, user_id, watchlist, status, environment, observations_count, autonomous_decisions_count, completed_trade_cycles_count, target_observations, target_autonomous_runs, target_completed_trade_cycles, use_paper_validation_gates")
            .eq("status", "RUNNING")
            .eq("environment", "paper")
            .maybeSingle();

        if (error) {
            return NextResponse.json({ success: false, error: `Real error finding active test: ${error.message}` }, { status: 500 });
        }
        if (!activeTest) {
            return NextResponse.json({ success: true, skipped: true, reason: "No active RUNNING+PAPER test harness found." });
        }

        const result = await runObservationCycle(activeTest.user_id, activeTest.id, activeTest.watchlist, true, activeTest.use_paper_validation_gates);

        // Real, honest completion check -- per the real, configured
        // targets on this specific test, not a hardcoded 100.
        const observationsMet = activeTest.observations_count + 1 >= activeTest.target_observations;
        const decisionsMet = activeTest.autonomous_decisions_count + (result.newDecisionFormed ? 1 : 0) >= activeTest.target_autonomous_runs;
        const cyclesMet = activeTest.completed_trade_cycles_count >= activeTest.target_completed_trade_cycles;

        if (observationsMet && decisionsMet && cyclesMet) {
            await supabase.from("quant_test_harness").update({ status: "COMPLETED", stop_reason: "Real validation parameters met.", completed_at: new Date().toISOString() }).eq("id", activeTest.id);
        }

        return NextResponse.json({ success: true, testId: activeTest.id, cycle: result });
    } catch (err) {
        return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Unknown real error." }, { status: 500 });
    }
}
