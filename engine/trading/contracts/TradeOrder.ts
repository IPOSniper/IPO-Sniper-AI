/**
 * Shared types for the paper-trading loop (RiskEngine + Alpaca
 * provider + order-log persistence). Deliberately narrow: market
 * orders only, one side each way, for the paper-trading-first stage
 * described in docs/HEDGE_FUND_ARCHITECTURE.md. Bracket/limit orders
 * and options are a later stage, not this one.
 */

export type OrderSide = "buy" | "sell";

/** Real options contract multiplier -- 1 option contract represents
 * 100 shares of real exposure. Getting this wrong would mean the
 * risk engine silently underestimates real dollar risk by 100x for
 * every options order. */
export const OPTIONS_CONTRACT_MULTIPLIER = 100;

/** What the app is asking to do, before any risk check. */
export interface TradeOrderRequest {
    /** For equity: a plain ticker (e.g. "AAPL"). For options: the real OCC-format contract symbol (e.g. "AAPL260320C00220000") -- same field, since Alpaca's own /v2/orders endpoint treats both identically at the API level. */
    ticker: string;
    side: OrderSide;
    /** Whole shares for equity, whole contracts for options -- no fractional-share/contract math yet. */
    qty: number;
    /** Defaults to "equity" for backward compatibility with every existing caller. Options orders MUST set this explicitly -- RiskEngine derives the real 100x contract multiplier from it. */
    assetType?: "equity" | "option";
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

/** One real point in Alpaca's portfolio history timeseries. */
export interface PortfolioHistoryPoint {
    timestamp: string; // ISO 8601
    equity: number;
    profitLoss: number | null;
    profitLossPercent: number | null;
}
