"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { RiskEngine, DEFAULT_RISK_LIMITS, type RiskLimits } from "@/engine/trading/risk/RiskEngine";
import { FinnhubQuoteProvider } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import type { TradingAccount, TradingPosition, TradeOrderResult, OrderSide } from "@/engine/trading/contracts/TradeOrder";

const provider = new AlpacaPaperTradingProvider();
const riskEngine = new RiskEngine();

export interface AccountResult {
    success: boolean;
    error?: string;
    account?: TradingAccount;
}

/**
 * Alpaca is the source of truth for account/position state (see
 * AlpacaPaperTradingProvider.ts) — this reads live from Alpaca on
 * every call rather than caching in Supabase, so it's never stale
 * relative to fills/dividends/etc. that happen outside this app.
 */
export async function getTradingAccount(): Promise<AccountResult> {
    try {
        const account = await provider.getAccount();
        return { success: true, account };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to load Alpaca account." };
    }
}

export interface PositionsResult {
    success: boolean;
    error?: string;
    positions?: TradingPosition[];
}

export async function getTradingPositions(): Promise<PositionsResult> {
    try {
        const positions = await provider.getPositions();
        return { success: true, positions };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to load Alpaca positions." };
    }
}

export interface OrderHistoryResult {
    success: boolean;
    error?: string;
    orders?: TradeOrderResult[];
}

export async function getOrderHistory(): Promise<OrderHistoryResult> {
    try {
        const orders = await provider.listOrders(20);
        return { success: true, orders };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to load Alpaca order history." };
    }
}

export interface PlaceOrderResult {
    success: boolean;
    error?: string;
    order?: TradeOrderResult;
}

/**
 * The only path that can submit an order to Alpaca in this app.
 * Sequence is fixed and non-negotiable: load real account +
 * positions + quote from source, run RiskEngine.check(), log the
 * attempt (allowed or not) to paper_trade_orders, and ONLY THEN
 * call Alpaca if allowed was true. Never reorder this to place the
 * order first and check after.
 */
export async function placeOrder(
    ticker: string,
    side: OrderSide,
    qty: number,
    reasoning?: string,
    limits: RiskLimits = DEFAULT_RISK_LIMITS
): Promise<PlaceOrderResult> {

    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
        return { success: false, error: "Ticker is required." };
    }

    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
        return { success: false, error: "Quantity must be a positive whole number of shares." };
    }

    let account: TradingAccount;
    let positions: TradingPosition[];

    try {
        [account, positions] = await Promise.all([
            provider.getAccount(),
            provider.getPositions(),
        ]);
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to load account state from Alpaca." };
    }

    let estimatedPrice: number | null = null;
    try {
        const quote = await new FinnhubQuoteProvider().getQuote(normalizedTicker);
        estimatedPrice = quote.price;
    } catch {
        // Sell orders can proceed without a fresh quote (see
        // RiskEngine.check) — buys cannot, and RiskEngine will
        // reject with a clear reason when estimatedPrice is null.
    }

    const riskEngineInstance = new RiskEngine(limits);
    const result = riskEngineInstance.check(
        { ticker: normalizedTicker, side, qty, reasoning },
        account,
        positions,
        estimatedPrice
    );

    if (!result.allowed) {
        await logOrderAttempt({
            ticker: normalizedTicker,
            side,
            qty,
            brokerOrderId: null,
            status: null,
            estimatedOrderValue: result.estimatedOrderValue,
            riskAllowed: false,
            riskBlockedReason: result.reason ?? "Blocked by risk engine.",
            reasoning,
        });
        return { success: false, error: result.reason ?? "Order blocked by risk limits." };
    }

    try {
        const order = await provider.placeOrder({ ticker: normalizedTicker, side, qty, reasoning });

        await logOrderAttempt({
            ticker: normalizedTicker,
            side,
            qty,
            brokerOrderId: order.brokerOrderId,
            status: order.status,
            estimatedOrderValue: result.estimatedOrderValue,
            riskAllowed: true,
            riskBlockedReason: null,
            reasoning,
        });

        return { success: true, order };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Alpaca rejected the order.";

        // Risk engine said yes but the broker itself rejected it
        // (e.g. insufficient buying power Alpaca calculates
        // differently, market closed, symbol not tradable) — still
        // logged, so the audit trail shows the broker-level failure
        // distinctly from a risk-engine block.
        await logOrderAttempt({
            ticker: normalizedTicker,
            side,
            qty,
            brokerOrderId: null,
            status: "broker_rejected",
            estimatedOrderValue: result.estimatedOrderValue,
            riskAllowed: true,
            riskBlockedReason: message,
            reasoning,
        });

        return { success: false, error: message };
    }
}

/**
 * Independent kill switch — cancels every open order regardless of
 * what placed them. Reachable even if the risk engine or a
 * scheduled loop is misbehaving, per
 * docs/HEDGE_FUND_ARCHITECTURE.md's requirement that the kill
 * switch not depend on the same code path it might need to stop.
 */
export async function killSwitch(): Promise<{ success: boolean; error?: string }> {
    try {
        await provider.cancelAllOrders();
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to cancel orders." };
    }
}

interface LogOrderAttemptParams {
    ticker: string;
    side: OrderSide;
    qty: number;
    brokerOrderId: string | null;
    status: string | null;
    estimatedOrderValue: number | null;
    riskAllowed: boolean;
    riskBlockedReason: string | null;
    reasoning?: string;
}

/**
 * Best-effort audit log. Deliberately does not throw or block the
 * order flow if Supabase isn't configured or the insert fails —
 * losing an audit-log row is bad, but blocking a risk-approved
 * order (or a risk-blocked notice) because logging failed would be
 * worse. Matches the "empty and can't-check look the same" pattern
 * used elsewhere in this app, applied to logging instead of reads.
 */
async function logOrderAttempt(params: LogOrderAttemptParams): Promise<void> {

    if (!isSupabaseConfigured()) {
        return;
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return;
        }

        await supabase.from("paper_trade_orders").insert({
            user_id: user.id,
            ticker: params.ticker,
            side: params.side,
            qty: params.qty,
            broker_order_id: params.brokerOrderId,
            status: params.status,
            estimated_order_value: params.estimatedOrderValue,
            risk_allowed: params.riskAllowed,
            risk_blocked_reason: params.riskBlockedReason,
            reasoning: params.reasoning ?? null,
        });
    } catch {
        // Swallow — see docstring above.
    }
}
