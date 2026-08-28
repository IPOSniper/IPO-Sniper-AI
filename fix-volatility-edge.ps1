Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$content = @'
/**
 * Volatility Edge v1 -- Decision Matrix Phase 4.
 *
 * Paper/recorded only. This module NEVER places an order and has NO
 * execution authority -- see decisionMatrix/types.ts's non-negotiable
 * rule. It only produces a candidate "edge" layer record for later
 * measurement.
 *
 * Signal: implied volatility (average IV of near-the-money contracts
 * in the standard target DTE window) minus realized volatility
 * (annualized stdev of daily log returns over the trailing window).
 * This is a simple, disclosed calculation -- NOT an IV rank/percentile
 * (that would require historical IV we do not persist yet -- an
 * honest, explicitly deferred gap, not faked here).
 *
 * Thresholds are heuristic and adjustable -- not backtested. Treat as
 * an observation signal, not a validated edge, until the Evidence &
 * Performance Ledger can measure it against real outcomes.
 */

import { AlpacaBarsProvider, type PriceBar } from "@/engine/evidence/providers/AlpacaBarsProvider";
import { AlpacaOptionsProvider } from "@/engine/trading/providers/AlpacaOptionsProvider";

export type VolatilityEdgeDecision = "iv_rich" | "iv_cheap" | "no_edge";

export interface VolatilityEdgeResult {
    ticker: string;
    decision: VolatilityEdgeDecision;
    status: "PASS" | "FAIL" | "NOT_EVALUATED";
    reasonCode: string;
    realizedVolPercent: number | null;
    impliedVolPercent: number | null;
    gapPercent: number | null;
}

const MIN_BARS_REQUIRED = 21;
const RICH_THRESHOLD = 15; // IV exceeds realized by this many percentage points
const CHEAP_THRESHOLD = -15;

export async function detectVolatilityEdge(ticker: string): Promise<VolatilityEdgeResult> {
    try {
        const bars: PriceBar[] = await new AlpacaBarsProvider().getBars(ticker, "1Day", 22);
        if (!bars || bars.length < MIN_BARS_REQUIRED) {
            return {
                ticker, decision: "no_edge", status: "NOT_EVALUATED",
                reasonCode: "INSUFFICIENT_PRICE_HISTORY",
                realizedVolPercent: null, impliedVolPercent: null, gapPercent: null,
            };
        }

        const closes = bars.map(b => b.close);
        const logReturns: number[] = [];
        for (let i = 1; i < closes.length; i++) {
            logReturns.push(Math.log(closes[i] / closes[i - 1]));
        }
        const mean = logReturns.reduce((s, r) => s + r, 0) / logReturns.length;
        const variance = logReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (logReturns.length - 1);
        const dailyStdev = Math.sqrt(variance);
        const realizedVolPercent = dailyStdev * Math.sqrt(252) * 100;

        const chain = await new AlpacaOptionsProvider().getOptionChain(ticker);
        const today = new Date();
        const nearTheMoney = chain.filter(c => {
            const dte = Math.round((new Date(c.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return dte >= 20 && dte <= 60 && c.delta !== null && Math.abs(c.delta) >= 0.35 && Math.abs(c.delta) <= 0.65 && c.impliedVolatility !== null;
        });

        if (nearTheMoney.length === 0) {
            return {
                ticker, decision: "no_edge", status: "NOT_EVALUATED",
                reasonCode: "NO_USABLE_IV_CONTRACTS",
                realizedVolPercent, impliedVolPercent: null, gapPercent: null,
            };
        }

        const impliedVolPercent = (nearTheMoney.reduce((s, c) => s + (c.impliedVolatility ?? 0), 0) / nearTheMoney.length) * 100;
        const gapPercent = impliedVolPercent - realizedVolPercent;

        let decision: VolatilityEdgeDecision = "no_edge";
        let status: "PASS" | "FAIL" = "FAIL";
        let reasonCode = "GAP_WITHIN_NORMAL_RANGE";

        if (gapPercent >= RICH_THRESHOLD) {
            decision = "iv_rich";
            status = "PASS";
            reasonCode = "IV_EXCEEDS_REALIZED";
        } else if (gapPercent <= CHEAP_THRESHOLD) {
            decision = "iv_cheap";
            status = "PASS";
            reasonCode = "IV_BELOW_REALIZED";
        }

        return { ticker, decision, status, reasonCode, realizedVolPercent, impliedVolPercent, gapPercent };
    } catch (err) {
        return {
            ticker, decision: "no_edge", status: "NOT_EVALUATED",
            reasonCode: err instanceof Error ? `ERROR: ${err.message}`.slice(0, 100) : "UNKNOWN_ERROR",
            realizedVolPercent: null,