import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/serviceRole";
import { runObservationCycle } from "@/engine/quant/orchestration/ObservationCycle";
import { isMarketOpen } from "@/engine/quant/orchestration/MarketHours";
import { scanForOpportunities } from "@/engine/quant/OpportunityScanner";

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
        let { data: activeTest, error } = await supabase
            .from("quant_test_harness")
            .select("id, user_id, watchlist, status, environment, observations_count, autonomous_decisions_count, completed_trade_cycles_count, target_observations, target_autonomous_runs, target_completed_trade_cycles, use_paper_validation_gates")
            .eq("status", "RUNNING")
            .eq("environment", "paper")
            .maybeSingle();

        if (error) {
            return NextResponse.json({ success: false, error: `Real error finding active test: ${error.message}` }, { status: 500 });
        }

        if (!activeTest) {
            const { data: anyNonTerminal } = await supabase
                .from("quant_test_harness")
                .select("id")
                .in("status", ["IDLE", "RUNNING", "PAUSED", "STOPPING"])
                .limit(1)
                .maybeSingle();

            if (anyNonTerminal) {
                return NextResponse.json({ success: true, skipped: true, reason: "A test exists but isn't currently RUNNING (paused/stopping) -- not auto-creating a duplicate." });
            }

            const { data: profileRow } = await supabase
                .from("profiles")
                .select("id")
                .limit(1)
                .maybeSingle();
            const realUserId = profileRow?.id;

            if (!realUserId) {
                return NextResponse.json({ success: true, skipped: true, reason: "No real user found to auto-initialize a test for." });
            }

            const candidates = await scanForOpportunities(12, 20);
            const watchlist = candidates.length > 0 ? candidates.map(c => c.ticker) : ["RIOT", "IREN", "RKLB", "KTOS", "CLSK"];

            const { data: newTest, error: insertError } = await supabase
                .from("quant_test_harness")
                .insert({
                    user_id: realUserId,
                    name: "Auto-Initialized Validation Experiment",
                    status: "RUNNING",
                    target_observations: 500,
                    target_autonomous_runs: 100,
                    target_completed_trade_cycles: 25,
                    observation_interval_seconds: 600,
                    watchlist,
                    use_paper_validation_gates: true,
                    started_at: new Date().toISOString(),
                })
                .select("id, user_id, watchlist, status, environment, observations_count, autonomous_decisions_count, completed_trade_cycles_count, target_observations, target_autonomous_runs, target_completed_trade_cycles, use_paper_validation_gates")
                .single();

            if (insertError || !newTest) {
                return NextResponse.json({ success: true, skipped: true, reason: `Auto-initialization attempted but failed: ${insertError?.message ?? "unknown error"}.` });
            }

            activeTest = newTest;
        }

        const result = await runObservationCycle(activeTest.user_id, activeTest.id, activeTest.watchlist, true, activeTest.use_paper_validation_gates);

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
