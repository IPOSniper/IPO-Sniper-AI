/**
 * Shared types for the paper-trading loop (RiskEngine + Alpaca
 * provider + order-log persistence). Deliberately narrow: market
 * orders only, one side each way, for the paper-trading-first stage
 * described in docs/HEDGE_FUND_ARCHITECTURE.md. Bracket/limit orders
 * and options are a later stage, not this one.
 */

export type OrderSide = "buy" | "sell";

/** What the app is asking to do, before any risk check. */
export interface TradeOrderRequest {
    ticker: string;
    side: OrderSide;
    /** Whole shares only for this stage — no fractional-share math yet. */
    qty: number;
    /** Free-text link back to the research/conviction that produced this order, for the audit log. */
    reasoning?: string;
}

/** Alpaca account snapshot, the fields the risk engine and UI need. */
export interface TradingAccount {
    equity: number;
    cash: number;
    buyingPower: number;
    /** Alpaca flags an account after 4+ day-trades in 5 days on <$25k equity. Surfaced, not enforced client-side, since Alpaca itself blocks the order. */
    patternDayTraderFlag: boolean;
    /** True when Alpaca has blocked all trading on the account (e.g. after a violation). */
    tradingBlocked: boolean;
}

/** A currently-open position, as reported by Alpaca (Alpaca is the source of truth — see RiskEngine.ts). */
export interface TradingPosition {
    ticker: string;
    qty: number;
    avgEntryPrice: number;
    marketValue: number;
    unrealizedPl: number;
    unrealizedPlPercent: number;
    currentPrice: number;
}

/** Result of a submitted (accepted-by-Alpaca) order. */
export interface TradeOrderResult {
    brokerOrderId: string;
    ticker: string;
    side: OrderSide;
    qty: number;
    status: string;
    submittedAt: string;
}
