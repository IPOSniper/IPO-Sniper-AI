/**
 * Hard, code-enforced risk limits — the piece
 * docs/HEDGE_FUND_ARCHITECTURE.md calls out as required BEFORE any
 * order reaches Alpaca: "checks that BLOCK an order from being
 * placed, not just numbers displayed in a UI."
 *
 * This engine only ever returns a decision — it never places or
 * cancels an order itself. The order route (app/api/trading/orders)
 * is the only caller, and must reject the order outright when
 * `allowed` is false rather than logging a warning and proceeding.
 *
 * Limits are intentionally conservative defaults for the
 * paper-trading stage, not tuned for real capital. Alpaca's own
 * account state (equity, existing positions) is treated as the
 * source of truth here rather than any locally-cached number, so a
 * position opened outside this app (or in Alpaca's own UI) is still
 * counted correctly.
 */

import type { TradeOrderRequest, TradingAccount, TradingPosition } from "../contracts/TradeOrder";
import { OPTIONS_CONTRACT_MULTIPLIER } from "../contracts/TradeOrder";

export interface RiskLimits {
    /** Max size of any single order, as a fraction of account equity. */
    maxPositionSizePercent: number;
    /** Max number of distinct tickers held at once. */
    maxConcurrentPositions: number;
    /** Max realized+unrealized loss for the day, as a fraction of equity, before new orders are blocked. */
    maxDailyLossPercent: number;
    /** Floor below which no new BUY orders are allowed, regardless of the above — a backstop against a runaway loop draining the account. */
    minCashReservePercent: number;
}

export const DEFAULT_RISK_LIMITS: RiskLimits = {
    maxPositionSizePercent: 0.10,
    maxConcurrentPositions: 10,
    maxDailyLossPercent: 0.03,
    minCashReservePercent: 0.10,
};

export interface RiskCheckResult {
    allowed: boolean;
    reason?: string;
    /** Estimated dollar size of this order, for the audit log — null if price is unknown (see note in check()). */
    estimatedOrderValue: number | null;
}

export class RiskEngine {

    constructor(private limits: RiskLimits = DEFAULT_RISK_LIMITS) {}

    /**
     * @param order        The order being requested.
     * @param account      Current Alpaca account snapshot.
     * @param positions    Current Alpaca positions.
     * @param estimatedPrice  Latest quote for the ticker (e.g. from FinnhubQuoteProvider) — required to size a BUY against equity. A sell is allowed to proceed without one since it only ever reduces exposure.
     */
    check(
        order: TradeOrderRequest,
        account: TradingAccount,
        positions: TradingPosition[],
        estimatedPrice: number | null
    ): RiskCheckResult {

        if (account.tradingBlocked) {
            return { allowed: false, reason: "Alpaca has blocked trading on this account.", estimatedOrderValue: null };
        }

        if (!Number.isFinite(order.qty) || order.qty <= 0) {
            return { allowed: false, reason: "Order quantity must be a positive number.", estimatedOrderValue: null };
        }

        // Real options contract multiplier -- 1 contract = 100 shares
        // of real exposure. Every dollar-value calculation below MUST
        // use this, or an options order's real risk is silently
        // understated by 100x.
        const contractMultiplier = order.assetType === "option" ? OPTIONS_CONTRACT_MULTIPLIER : 1;

        // Daily loss circuit breaker — checked before anything else,
        // so a bad day halts BOTH buys and sells-that-aren't-closing-
        // risk... except closing risk (a sell that reduces or exits
        // an existing losing position) must stay allowed, or the
        // breaker traps the account in the position that tripped it.
        const dailyLossPercent = account.equity > 0
            ? -(this.dailyPl(positions)) / account.equity
            : 0;

        const isClosingSell = order.side === "sell" &&
            positions.some(p => p.ticker === order.ticker && p.qty > 0);

        if (dailyLossPercent >= this.limits.maxDailyLossPercent && !isClosingSell) {
            return {
                allowed: false,
                reason: `Daily loss circuit breaker tripped (${(dailyLossPercent * 100).toFixed(1)}% >= ${(this.limits.maxDailyLossPercent * 100).toFixed(1)}% limit). Only closing sells are allowed until this resets.`,
                estimatedOrderValue: null,
            };
        }

        if (order.side === "sell") {
            // Selling reduces exposure — no position-size or
            // concurrency check needed. Still worth confirming the
            // account actually holds enough to sell (no naked
            // shorting in this stage).
            const held = positions.find(p => p.ticker === order.ticker);
            if (!held || held.qty < order.qty) {
                return {
                    allowed: false,
                    reason: `Cannot sell ${order.qty} ${order.ticker} — only ${held?.qty ?? 0} held. Shorting is not enabled in this stage.`,
                    estimatedOrderValue: null,
                };
            }
            return { allowed: true, estimatedOrderValue: estimatedPrice ? estimatedPrice * order.qty * contractMultiplier : null };
        }

        // From here down: BUY-side checks only.

        if (estimatedPrice === null || !Number.isFinite(estimatedPrice) || estimatedPrice <= 0) {
            return { allowed: false, reason: "No current quote available to size this order against account equity.", estimatedOrderValue: null };
        }

        const orderValue = estimatedPrice * order.qty * contractMultiplier;

        const alreadyHoldsTicker = positions.some(p => p.ticker === order.ticker);
        if (!alreadyHoldsTicker && positions.length >= this.limits.maxConcurrentPositions) {
            return {
                allowed: false,
                reason: `Max concurrent positions reached (${this.limits.maxConcurrentPositions}). Close an existing position before opening a new one.`,
                estimatedOrderValue: orderValue,
            };
        }

        const positionSizePercent = account.equity > 0 ? orderValue / account.equity : 1;
        if (positionSizePercent > this.limits.maxPositionSizePercent) {
            return {
                allowed: false,
                reason: `Order value $${orderValue.toFixed(2)} is ${(positionSizePercent * 100).toFixed(1)}% of equity, exceeding the ${(this.limits.maxPositionSizePercent * 100).toFixed(0)}% max position size limit.`,
                estimatedOrderValue: orderValue,
            };
        }

        const cashAfter = account.cash - orderValue;
        const minCashRequired = account.equity * this.limits.minCashReservePercent;
        if (cashAfter < minCashRequired) {
            return {
                allowed: false,
                reason: `This order would leave $${cashAfter.toFixed(2)} cash, below the required $${minCashRequired.toFixed(2)} (${(this.limits.minCashReservePercent * 100).toFixed(0)}% of equity) reserve.`,
                estimatedOrderValue: orderValue,
            };
        }

        if (orderValue > account.buyingPower) {
            return {
                allowed: false,
                reason: `Order value $${orderValue.toFixed(2)} exceeds available buying power $${account.buyingPower.toFixed(2)}.`,
                estimatedOrderValue: orderValue,
            };
        }

        return { allowed: true, estimatedOrderValue: orderValue };
    }

    private dailyPl(positions: TradingPosition[]): number {
        // Alpaca's per-position unrealized_pl is since entry, not
        // since market open, so this undercounts true daily P&L for
        // positions opened on prior days. Documented limitation:
        // a same-day-open-basis daily P&L needs Alpaca's portfolio
        // history endpoint, not the positions endpoint — worth
        // swapping in before trusting this breaker with real money.
        return positions.reduce((sum, p) => sum + p.unrealizedPl, 0);
    }
}
