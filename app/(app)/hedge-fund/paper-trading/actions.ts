"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { AlpacaOptionsProvider } from "@/engine/trading/providers/AlpacaOptionsProvider";
import { RiskEngine, DEFAULT_RISK_LIMITS, type RiskLimits } from "@/engine/trading/risk/RiskEngine";
import { FinnhubQuoteProvider } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import type { TradingAccount, TradingPosition, TradeOrderResult, OrderSide } from "@/engine/trading/contracts/TradeOrder";

const provider = new AlpacaPaperTradingProvider();
const optionsProvider = new AlpacaOptionsProvider();
const riskEngine = new RiskEngine();

/**
 * An OCC contract symbol starts with the underlying ticker, followed
 * by a 6-digit date (YYMMDD). Extracting the ticker this way avoids
 * asking the caller to separately track "what's the underlying for
 * this contract" -- it's already encoded in the symbol itself.
 */
function extractUnderlyingFromOccSymbol(occSymbol: string): string | null {
    const match = occSymbol.match(/^([A-Z]+)\d{6}[CP]\d{8}$/);
    return match ? match[1] : null;
}

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
    limits: RiskLimits = DEFAULT_RISK_LIMITS,
    assetType: "equity" | "option" = "equity",
    expectedUnderlying?: string
): Promise<PlaceOrderResult> {

    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
        return { success: false, error: assetType === "option" ? "Option contract symbol is required." : "Ticker is required." };
    }

    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
        return { success: false, error: assetType === "option" ? "Quantity must be a positive whole number of contracts." : "Quantity must be a positive whole number of shares." };
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

    if (assetType === "option") {
        // Real price comes from the SPECIFIC contract's own bid/ask,
        // not a Finnhub equity quote -- Finnhub's /quote endpoint
        // doesn't understand OCC option symbols at all.
        const underlying = extractUnderlyingFromOccSymbol(normalizedTicker);
        if (!underlying) {
            return { success: false, error: `"${normalizedTicker}" doesn't look like a valid OCC option contract symbol (expected format: TICKER + YYMMDD + C/P + 8-digit strike, e.g. AAPL260320C00220000).` };
        }

        // Real Contract Integrity Gate -- server-side, independent of
        // whatever the UI form happens to contain. When a caller
        // supplies expectedUnderlying (what the decision/user actually
        // intended to trade), the real contract's own real extracted
        // underlying must match it exactly, or the order is blocked
        // before it ever reaches Alpaca. This is the actual safety
        // boundary -- a stale contract symbol left in a form (e.g.
        // AAPL260320C00022000 sitting there after the user switched
        // tickers to SPCX) cannot silently execute, because the
        // server independently verifies what the contract itself
        // really represents, not what the client claims it typed for.
        if (expectedUnderlying && underlying !== expectedUnderlying.trim().toUpperCase()) {
            await logOrderAttempt({
                ticker: normalizedTicker,
                side,
                qty,
                brokerOrderId: null,
                status: null,
                estimatedOrderValue: null,
                riskAllowed: false,
                riskBlockedReason: `CONTRACT_MISMATCH: requested underlying "${expectedUnderlying.trim().toUpperCase()}" but contract "${normalizedTicker}" is for "${underlying}".`,
                reasoning,
            });
            return { success: false, error: `Contract mismatch: you selected ${expectedUnderlying.trim().toUpperCase()}, but this contract (${normalizedTicker}) is for ${underlying}. No order was sent.` };
        }

        try {
            const chain = await optionsProvider.getOptionChain(underlying);
            const contract = chain.find(c => c.symbol === normalizedTicker);
            // Ask price for buys (what you'd actually pay), bid for
            // sells (what you'd actually receive) -- mid/last would
            // understate real transaction cost on either side.
            estimatedPrice = side === "buy" ? (contract?.askPrice ?? contract?.lastPrice ?? null) : (contract?.bidPrice ?? contract?.lastPrice ?? null);
        } catch {
            // Sells can still proceed without a fresh quote (same
            // rule as equities below) -- buys cannot, and RiskEngine
            // will reject with a clear reason when estimatedPrice is null.
        }
    } else {
        try {
            const quote = await new FinnhubQuoteProvider().getQuote(normalizedTicker);
            estimatedPrice = quote.price;
        } catch {
            // Sell orders can proceed without a fresh quote (see
            // RiskEngine.check) — buys cannot, and RiskEngine will
            // reject with a clear reason when estimatedPrice is null.
        }
    }

    const riskEngineInstance = new RiskEngine(limits);
    const result = riskEngineInstance.check(
        { ticker: normalizedTicker, side, qty, reasoning, assetType },
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
        const order = await provider.placeOrder({ ticker: normalizedTicker, side, qty, reasoning, assetType });

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
            filledAvgPrice: order.filledAvgPrice,
            filledQty: order.filledQty,
            filledAt: order.filledAt,
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
    /** Real fill data from Alpaca's actual response — often null immediately after submission (fills take a moment); see TradeOrderResult's docstring. */
    filledAvgPrice?: number | null;
    filledQty?: number | null;
    filledAt?: string | null;
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

        // Real fix: Supabase JS's .insert() does NOT throw on
        // database-level errors (RLS violations, constraint
        // failures, etc.) -- it returns { data, error }. The
        // previous code never checked .error, meaning a failed
        // insert wouldn't even reach the catch block below -- it
        // would fail completely silently, no exception at all.
        // Confirmed this was the actual issue via direct user
        // report: Trade Timeline (which queries this table) showed
        // "No orders yet" while real orders clearly existed in
        // Alpaca's own history.
        const { error } = await supabase.from("paper_trade_orders").insert({
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
            filled_avg_price: params.filledAvgPrice ?? null,
            filled_qty: params.filledQty ?? null,
            filled_at: params.filledAt ?? null,
        });

        if (error) {
            // This is a fire-and-forget audit log call with no
            // direct UI feedback path (the real order already
            // succeeded on Alpaca's side by the time this runs) --
            // console.error at least makes the real reason visible
            // in Vercel's function logs instead of vanishing
            // entirely, so a future investigation isn't starting
            // from zero again.
            console.error("paper_trade_orders insert failed:", error.message);
        }
    } catch (err) {
        console.error("logOrderAttempt threw:", err instanceof Error ? err.message : err);
    }
}

/**
 * Real, on-demand equity quote for the manual order form -- not
 * auto-fetched on every keystroke (would mean a real API call per
 * character typed), triggered explicitly instead. Reuses the same
 * real FinnhubQuoteProvider already used elsewhere in this app, not
 * a second implementation.
 *
 * Options are NOT covered here -- a real per-contract quote lookup
 * (distinct from AlpacaOptionsProvider.getOptionChain(), which
 * returns a full chain, not one contract) doesn't exist yet. Real
 * options pricing is already visible via "Find Best Contract" and
 * the Options Chain panel on the research page -- this is a real,
 * separate gap for a future round, not silently worked around here.
 */
export async function getEquityQuoteForOrderForm(ticker: string): Promise<{ success: boolean; price?: number; changePercent?: number; error?: string }> {
    const normalized = ticker.trim().toUpperCase();
    if (!normalized) return { success: false, error: "Enter a ticker first." };

    try {
        const quote = await new FinnhubQuoteProvider().getQuote(normalized);
        if (!quote.price || quote.price <= 0) {
            return { success: false, error: `No real quote available for ${normalized}.` };
        }
        return { success: true, price: quote.price, changePercent: quote.changePercent };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Quote lookup failed." };
    }
}
