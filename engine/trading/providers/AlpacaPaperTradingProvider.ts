/**
 * Real Alpaca Paper Trading API client — same request/response shape
 * as Alpaca's live trading API per their docs, pointed at the paper
 * base URL so nothing here can touch real money. See
 * docs/HEDGE_FUND_ARCHITECTURE.md for why paper-first is the only
 * acceptable starting point.
 *
 * Requires ALPACA_API_KEY_ID + ALPACA_SECRET_KEY from a Paper Trading
 * account (Alpaca issues separate key pairs for paper vs. live — a
 * live key pair will not authenticate against the paper base URL).
 *
 * Written against Alpaca's documented Trading API
 * (https://docs.alpaca.markets/reference/trading-api), not run live
 * — no network access in this sandbox. Verify against a real paper
 * account before trusting order placement.
 */

import type {
    TradingAccount,
    TradingPosition,
    TradeOrderRequest,
    TradeOrderResult,
    PortfolioHistoryPoint,
} from "../contracts/TradeOrder";

/** Result of a real per-symbol Alpaca asset eligibility check (Phase 2). */
export interface AssetEligibility {
    tradable: boolean;
    overnightTradable: boolean;
    overnightHalted: boolean;
}

const DEFAULT_BASE_URL = "https://paper-api.alpaca.markets";

export class AlpacaPaperTradingProvider {

    private baseUrl: string;

    constructor() {
        // Allow override for anyone pointed at a different paper
        // endpoint, but default to Alpaca's documented paper URL —
        // never defaults to the live-trading URL.
        this.baseUrl = process.env.ALPACA_PAPER_BASE_URL || DEFAULT_BASE_URL;
    }

    private headers(): HeadersInit {

        const keyId = process.env.ALPACA_API_KEY_ID;
        const secret = process.env.ALPACA_SECRET_KEY;

        if (!keyId || !secret) {
            throw new Error(
                "ALPACA_API_KEY_ID / ALPACA_SECRET_KEY are missing. Generate a Paper Trading key pair at app.alpaca.markets (toggle to Paper Trading first — live and paper keys are separate)."
            );
        }

        return {
            "APCA-API-KEY-ID": keyId,
            "APCA-API-SECRET-KEY": secret,
            "Content-Type": "application/json",
        };
    }

    async getAccount(): Promise<TradingAccount> {

        const response = await fetch(`${this.baseUrl}/v2/account`, {
            headers: this.headers(),
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Alpaca account request failed: ${response.status} ${await this.safeText(response)}`);
        }

        const data = await response.json();

        return {
            equity: Number(data.equity),
            cash: Number(data.cash),
            buyingPower: Number(data.buying_power),
            patternDayTraderFlag: Boolean(data.pattern_day_trader),
            tradingBlocked: Boolean(data.trading_blocked),
        };
    }

    async getPositions(): Promise<TradingPosition[]> {

        const response = await fetch(`${this.baseUrl}/v2/positions`, {
            headers: this.headers(),
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Alpaca positions request failed: ${response.status} ${await this.safeText(response)}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            return [];
        }

        return data.map((p: Record<string, string>) => ({
            ticker: p.symbol,
            qty: Number(p.qty),
            avgEntryPrice: Number(p.avg_entry_price),
            marketValue: Number(p.market_value),
            unrealizedPl: Number(p.unrealized_pl),
            unrealizedPlPercent: Number(p.unrealized_plpc) * 100,
            currentPrice: Number(p.current_price),
        }));
    }

    /**
     * Real per-symbol asset eligibility from Alpaca's Assets API
     * (Session-Aware Multi-Asset Execution Bootstrap, Phase 2).
     * Returns null on any failure or unknown symbol -- callers must
     * treat null as "cannot confirm eligible," never as "assume
     * eligible." Alpaca documents eligibility as changeable at any
     * time (corporate actions, risk controls), so this should be
     * checked fresh per order, not cached.
     */
    async getAssetEligibility(ticker: string): Promise<AssetEligibility | null> {

        const response = await fetch(`${this.baseUrl}/v2/assets/${ticker}`, {
            headers: this.headers(),
            cache: "no-store",
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return {
            tradable: Boolean(data.tradable),
            // Alpaca's documented field for 24/5 overnight-session eligibility.
            // Absent/undefined is treated as "not confirmed eligible," matching
            // the method's overall null-on-uncertainty contract.
            overnightTradable: data.overnight_tradable === true,
            // Real corporate-action/risk-control halt flag, if Alpaca is
            // currently reporting one for this symbol.
            overnightHalted: data.overnight_halted === true,
        };
    }
    /**
     * Places a market, day-duration order. No limit/stop/bracket
     * support yet — see contracts/TradeOrder.ts for why this stage
     * is deliberately narrow. Caller (the order route) is
     * responsible for running this through RiskEngine BEFORE calling
     * this method — this method does not re-check limits itself, so
     * it must never be called directly from anywhere that skips the
     * risk gate.
     */

    async placeOrder(order: TradeOrderRequest): Promise<TradeOrderResult> {

        const response = await fetch(`${this.baseUrl}/v2/orders`, {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify({
                symbol: order.ticker,
                qty: order.qty,
                side: order.side,
                type: "market",
                time_in_force: "day",
            }),
        });

        if (!response.ok) {
            throw new Error(`Alpaca order request failed: ${response.status} ${await this.safeText(response)}`);
        }

        const data = await response.json();

        return {
            brokerOrderId: data.id,
            ticker: data.symbol,
            side: data.side,
            qty: Number(data.qty),
            status: data.status,
            submittedAt: data.submitted_at,
            filledAvgPrice: data.filled_avg_price !== null && data.filled_avg_price !== undefined ? Number(data.filled_avg_price) : null,
            filledQty: data.filled_qty !== null && data.filled_qty !== undefined ? Number(data.filled_qty) : null,
            filledAt: data.filled_at ?? null,
        };
    }

    async listOrders(limit = 20): Promise<TradeOrderResult[]> {

        const response = await fetch(
            `${this.baseUrl}/v2/orders?status=all&limit=${limit}&direction=desc`,
            { headers: this.headers(), cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`Alpaca order-history request failed: ${response.status} ${await this.safeText(response)}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            return [];
        }

        return data.map((o: Record<string, string | number | null>) => ({
            brokerOrderId: o.id as string,
            ticker: o.symbol as string,
            side: o.side as "buy" | "sell",
            qty: Number(o.qty),
            status: o.status as string,
            submittedAt: o.submitted_at as string,
            filledAvgPrice: o.filled_avg_price !== null && o.filled_avg_price !== undefined ? Number(o.filled_avg_price) : null,
            filledQty: o.filled_qty !== null && o.filled_qty !== undefined ? Number(o.filled_qty) : null,
            filledAt: (o.filled_at as string | null) ?? null,
        }));
    }

    /**
     * Independent kill switch — cancels every open order. Reachable
     * on its own, not dependent on whatever code path is placing
     * orders, per the "kill switch" requirement in
     * docs/HEDGE_FUND_ARCHITECTURE.md.
     */
    async cancelAllOrders(): Promise<void> {

        const response = await fetch(`${this.baseUrl}/v2/orders`, {
            method: "DELETE",
            headers: this.headers(),
        });

        if (!response.ok && response.status !== 207) {
            throw new Error(`Alpaca cancel-all request failed: ${response.status} ${await this.safeText(response)}`);
        }
    }

    /**
     * Real historical equity/P&L timeseries -- Alpaca's documented
     * /v2/account/portfolio/history endpoint, confirmed via direct
     * search of Alpaca's own docs and GitHub source before building
     * this (not guessed). Real response shape: parallel arrays
     * (timestamp, equity, profit_loss, profit_loss_pct), not an
     * array of objects -- easy to get wrong if assumed instead of
     * checked.
     *
     * One real ambiguity found while researching this: sources
     * disagree on whether `timestamp` values are Unix seconds or
     * milliseconds. Handled defensively below (detects magnitude)
     * rather than assuming either -- correct either way instead of
     * silently mis-parsing dates by a factor of 1000.
     *
     * NOT yet live-tested -- same caveat as every new endpoint this
     * session. Verify the real response shape matches on first use.
     */
    async getPortfolioHistory(period = "1M", timeframe = "1D"): Promise<PortfolioHistoryPoint[]> {

        const params = new URLSearchParams({ period, timeframe });
        const response = await fetch(`${this.baseUrl}/v2/account/portfolio/history?${params}`, {
            headers: this.headers(),
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Alpaca portfolio history request failed: ${response.status} ${await this.safeText(response)}`);
        }

        const data = await response.json();
        const timestamps: number[] = data.timestamp ?? [];
        const equity: number[] = data.equity ?? [];
        const profitLoss: number[] = data.profit_loss ?? [];
        const profitLossPct: number[] = data.profit_loss_pct ?? [];

        return timestamps.map((rawTs, i) => {
            // Defensive: treat as milliseconds if it's already
            // millisecond-scale (>= 10^12), otherwise treat as
            // seconds and convert. Real Unix seconds for any date
            // after 2001 are 10 digits (~10^9-10^10); milliseconds
            // would be 13 digits (~10^12-10^13).
            const ms = rawTs >= 1e12 ? rawTs : rawTs * 1000;
            return {
                timestamp: new Date(ms).toISOString(),
                equity: equity[i] ?? null,
                profitLoss: profitLoss[i] ?? null,
                profitLossPercent: profitLossPct[i] ?? null,
            };
        }).filter(p => p.equity !== null);
    }

    private async safeText(response: Response): Promise<string> {
        try {
            return await response.text();
        } catch {
            return "";
        }
    }
}
