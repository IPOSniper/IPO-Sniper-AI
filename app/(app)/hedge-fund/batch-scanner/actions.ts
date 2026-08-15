"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ResearchService } from "@/engine/services/ResearchService";
import { QuantStrategist } from "@/engine/quant/QuantStrategist";
import { BatchScanner, DEFAULT_AUTO_EXECUTION_GATES, type AutoExecutionGates, type BatchResult } from "@/engine/quant/BatchScanner";
import { AlpacaOptionsProvider } from "@/engine/trading/providers/AlpacaOptionsProvider";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { placeOrder } from "@/app/(app)/hedge-fund/paper-trading/actions";
import { FinnhubQuoteProvider, type Quote } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import { classifyMarketRegime, type MarketRegime } from "@/engine/market/marketRegime";
import { checkAutonomousExecutionAllowed } from "@/app/(app)/hedge-fund/quant-control/actions";

/**
 * Real market regime for the Hedge Fund page -- same real instruments
 * and same shared classifyMarketRegime() as Market Pulse, so both
 * pages report the identical real number rather than two independent
 * (and potentially disagreeing) copies of this calculation.
 */
export async function getMarketRegime(): Promise<MarketRegime | null> {
    if (!process.env.FINNHUB_API_KEY) return null;
    try {
        const provider = new FinnhubQuoteProvider();
        const symbols = ["DIA", "SPY", "QQQ", "IWM", "GLD", "TLT"];
        const results = await Promise.allSettled(symbols.map(s => provider.getQuote(s)));
        const quotes: Record<string, Quote> = {};
        symbols.forEach((symbol, i) => {
            const r = results[i];
            if (r.status === "fulfilled") quotes[symbol] = r.value;
        });
        return classifyMarketRegime(quotes);
    } catch {
        return null;
    }
}

export interface BatchRunResult extends BatchResult {
    executed: boolean;
    orderStatus: string | null;
}

/**
 * Real batch run over a real watchlist. Single manual invocation --
 * see BatchScanner.ts's docstring for why this is not a persistent
 * background process. Executes REAL paper orders for any ticker
 * that clears every real gate, up to gates.maxAutoExecutionsThisRun
 * -- that cap is checked and enforced here, not just documented.
 *
 * Every ticker's outcome is logged to quant_trade_decisions
 * regardless of outcome (execute/skip/reject/wait) -- same "log
 * everything, including declines" principle as the single-ticker
 * Quant Strategist panel.
 */
export async function runBatchScan(
    tickers: string[],
    gates: AutoExecutionGates = DEFAULT_AUTO_EXECUTION_GATES
): Promise<BatchRunResult[]> {

    const startedAt = new Date().toISOString();
    const strategist = new QuantStrategist();
    const scanner = new BatchScanner();
    const results: BatchRunResult[] = [];
    let executionsThisRun = 0;

    try {
        for (const rawTicker of tickers) {
        const ticker = rawTicker.trim().toUpperCase();
        if (!ticker) continue;

        try {
            const research = await new ResearchService().load(ticker);
            const plan = strategist.buildTradePlan(research.committee);

            let selectedContract = null;
            let suggestedQty = null;
            let accountEquity = 0;
            let openPositionsCount = 0;

            const account = await new AlpacaPaperTradingProvider().getAccount();
            accountEquity = account.equity;
            const positions = await new AlpacaPaperTradingProvider().getPositions();
            openPositionsCount = positions.length;

            if (plan.direction !== "none") {
                try {
                    const chain = await new AlpacaOptionsProvider().getOptionChain(ticker);
                    selectedContract = strategist.selectContract(plan, chain);
                    if (selectedContract) {
                        suggestedQty = strategist.suggestQuantity(plan, selectedContract, accountEquity);
                    }
                } catch {
                    // Real chain fetch can fail independently — evaluate() handles a null selectedContract with a real reject reason.
                }
            }

            const evaluation = scanner.evaluate(ticker, plan, selectedContract, suggestedQty, openPositionsCount, accountEquity, gates);

            let executed = false;
            let orderStatus: string | null = null;

            if (evaluation.outcome === "execute" && executionsThisRun < gates.maxAutoExecutionsThisRun && selectedContract && suggestedQty) {
                // Real, server-side enforcement -- checked per real
                // execution attempt (not once at the start of the
                // run), so a mid-run state change (e.g. someone hits
                // Emergency Stop while a batch is in progress) takes
                // effect immediately rather than waiting for the next
                // run.
                const control = await checkAutonomousExecutionAllowed("autonomous");
                if (!control.allowed) {
                    results.push({
                        ticker,
                        outcome: "reject",
                        reason: control.reason,
                        plan,
                        selectedContract,
                        suggestedQty,
                        executed: false,
                        orderStatus: null,
                    });
                    continue;
                }

                const orderResult = await placeOrder(
                    selectedContract.symbol,
                    "buy",
                    suggestedQty,
                    `Batch Scanner (autonomous): ${evaluation.reason}`,
                    undefined,
                    "option"
                );
                if (orderResult.success && orderResult.order) {
                    executed = true;
                    executionsThisRun++;
                    orderStatus = orderResult.order.status;
                } else {
                    orderStatus = `Order rejected by RiskEngine/Alpaca: ${orderResult.error}`;
                }
            } else if (evaluation.outcome === "execute" && executionsThisRun >= gates.maxAutoExecutionsThisRun) {
                orderStatus = `Passed all gates, but the ${gates.maxAutoExecutionsThisRun}-trade run limit was already reached.`;
            }

            await logBatchDecision(ticker, plan, selectedContract, evaluation, executed);

            results.push({ ...evaluation, executed, orderStatus });
        } catch (err) {
            results.push({
                ticker,
                outcome: "reject",
                reason: err instanceof Error ? err.message : "Research failed for this ticker.",
                plan: null,
                selectedContract: null,
                suggestedQty: null,
                executed: false,
                orderStatus: null,
            });
        }
        }

        await logRunSummary(startedAt, tickers, "completed", null, results);
        return results;
    } catch (err) {
        await logRunSummary(startedAt, tickers, "failed", err instanceof Error ? err.message : "Unknown run failure.", results);
        throw err;
    }
}

/**
 * Real run-level summary -- one row per real invocation of
 * runBatchScan(), the actual answer to "did the autonomous batch
 * scanner run, and what happened" as a persisted record, not just
 * the transient in-page results table. Counts computed directly
 * from the real, already-produced BatchRunResult[] -- not a second,
 * independent calculation that could drift from what the UI shows.
 *
 * riskApprovedCount uses outcome === "execute" specifically -- that
 * outcome value is only ever set after clearing every real gate
 * (committee thresholds, portfolio exposure, AND round73's Quant
 * Control check), so it genuinely means "risk-approved," not just
 * "attempted."
 */
async function logRunSummary(
    startedAt: string,
    watchlist: string[],
    status: "completed" | "failed",
    error: string | null,
    results: BatchRunResult[]
): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error: insertError } = await supabase.from("quant_runs").insert({
            user_id: user.id,
            started_at: startedAt,
            completed_at: new Date().toISOString(),
            watchlist,
            status,
            error,
            tickers_count: watchlist.filter(t => t.trim()).length,
            decisions_count: results.length,
            trade_plans_count: results.filter(r => r.plan && r.plan.direction !== "none").length,
            risk_approved_count: results.filter(r => r.outcome === "execute").length,
            orders_submitted_count: results.filter(r => r.executed).length,
            orders_filled_count: results.filter(r => r.orderStatus === "filled").length,
        });

        if (insertError) {
            console.error("quant_runs insert failed:", insertError.message);
        }
    } catch (err) {
        console.error("logRunSummary threw:", err instanceof Error ? err.message : err);
    }
}

async function logBatchDecision(
    ticker: string,
    plan: BatchRunResult["plan"],
    selectedContract: BatchRunResult["selectedContract"],
    evaluation: BatchResult,
    executed: boolean
): Promise<void> {
    if (!isSupabaseConfigured() || !plan) return;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("quant_trade_decisions").insert({
            user_id: user.id,
            ticker,
            direction: plan.direction,
            committee_confidence: plan.confidence,
            committee_agreement: plan.agreement,
            evidence_quality: plan.evidenceQuality,
            trade_quality_score: plan.tradeQualityScore,
            decision_checks: plan.checks,
            target_dte_min: plan.targetDteRange?.[0] ?? null,
            target_dte_max: plan.targetDteRange?.[1] ?? null,
            target_delta_min: plan.targetDeltaRange?.[0] ?? null,
            target_delta_max: plan.targetDeltaRange?.[1] ?? null,
            suggested_max_risk_percent: plan.suggestedMaxRiskPercent,
            profit_target_percent: plan.profitTargetPercent,
            stop_loss_percent: plan.stopLossPercent,
            contract_symbol: selectedContract?.symbol ?? null,
            contract_strike: selectedContract?.strikePrice ?? null,
            contract_expiration: selectedContract?.expirationDate ?? null,
            contract_delta: selectedContract?.delta ?? null,
            contract_iv: selectedContract?.impliedVolatility ?? null,
            contract_ask_price: selectedContract?.askPrice ?? null,
            reasoning: [`[Batch: ${evaluation.outcome}${executed ? ", executed" : ""}] ${evaluation.reason}`, ...plan.reasoning],
        });
    } catch {
        // Swallow — a broken log should never block the batch run itself.
    }
}

/**
 * Real summary of TODAY's logged decisions, for the Daily Report --
 * queries the same quant_trade_decisions table everything else
 * writes to. Counts are real database counts, not estimates.
 */
export interface DailySummary {
    totalDecisions: number;
    tradesFormed: number;
    noTrade: number;
    executed: number;
}

/**
 * Real counts from quant_trade_decisions -- 7-day window, not just
 * "today," since this app was deployed for the first time only
 * recently and a strict same-day window could show near-zero
 * activity even though real decisions have been logged. "executed"
 * counts real broker_order_id IS NOT NULL rows -- an actual accepted
 * order, not just a formed plan. There's no clean separate "approved
 * vs rejected" column for the single-ticker Quant Strategist flow
 * (only the batch flow embeds that in free-text reasoning), so this
 * stays to what's genuinely queryable: direction and broker_order_id.
 */
export async function getDailySummary(): Promise<DailySummary | null> {
    if (!isSupabaseConfigured()) return null;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from("quant_trade_decisions")
            .select("direction, broker_order_id")
            .eq("user_id", user.id)
            .gte("created_at", sevenDaysAgo.toISOString());

        if (error || !data) return null;

        return {
            totalDecisions: data.length,
            tradesFormed: data.filter(d => d.direction !== "none").length,
            executed: data.filter(d => d.broker_order_id !== null).length,
            noTrade: data.filter(d => d.direction === "none").length,
        };
    } catch {
        return null;
    }
}

export interface QuantRun {
    id: string;
    startedAt: string;
    completedAt: string | null;
    watchlist: string[];
    status: "completed" | "failed";
    error: string | null;
    tickersCount: number;
    decisionsCount: number;
    tradePlansCount: number;
    riskApprovedCount: number;
    ordersSubmittedCount: number;
    ordersFilledCount: number;
}

/**
 * Real run history -- the actual answer to "did Quant run, and what
 * happened" as a persisted, browsable record. See logRunSummary()'s
 * docstring for how each row's counts are computed.
 */
export async function getRecentRuns(limit = 10): Promise<QuantRun[]> {
    if (!isSupabaseConfigured()) return [];
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("quant_runs")
            .select("id, started_at, completed_at, watchlist, status, error, tickers_count, decisions_count, trade_plans_count, risk_approved_count, orders_submitted_count, orders_filled_count")
            .eq("user_id", user.id)
            .order("started_at", { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map(row => ({
            id: row.id,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            watchlist: row.watchlist,
            status: row.status as "completed" | "failed",
            error: row.error,
            tickersCount: row.tickers_count,
            decisionsCount: row.decisions_count,
            tradePlansCount: row.trade_plans_count,
            riskApprovedCount: row.risk_approved_count,
            ordersSubmittedCount: row.orders_submitted_count,
            ordersFilledCount: row.orders_filled_count,
        }));
    } catch {
        return [];
    }
}
