"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { placeOrder, killSwitch } from "@/app/(app)/hedge-fund/paper-trading/actions";
import type { TradingAccount, TradingPosition, TradeOrderResult, OrderSide } from "@/engine/trading/contracts/TradeOrder";

interface PaperTradingPanelProps {
    account: TradingAccount | null;
    accountError: string | null;
    positions: TradingPosition[];
    positionsError: string | null;
    orders: TradeOrderResult[];
    ordersError: string | null;
}

const REFRESH_INTERVAL_MS = 20_000;

/**
 * Client component so the order form and kill switch can hold local
 * state and re-run server actions without a full reload.
 * router.refresh() re-fetches account/positions/orders from Alpaca
 * after any change — same pattern as PositionManager.tsx.
 *
 * Auto-refreshes on a real interval too (not just after an action) —
 * this is what gives the panel a "live" feel without faking
 * anything: every tick is a genuine re-fetch of real Alpaca account
 * state, prices moving because the market is actually moving, not a
 * decorative animation.
 */
export default function PaperTradingPanel({
    account,
    accountError,
    positions,
    positionsError,
    orders,
    ordersError,
}: PaperTradingPanelProps) {

    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [ticker, setTicker] = useState("");
    const [assetType, setAssetType] = useState<"equity" | "option">("equity");
    const [side, setSide] = useState<OrderSide>("buy");
    const [qty, setQty] = useState("");
    const [reasoning, setReasoning] = useState("");
    const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        setLastRefreshed(new Date());
    }, [account, positions, orders]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            router.refresh();
        }, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [autoRefresh, router]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);

        const qtyNum = Number(qty);

        startTransition(async () => {
            const result = await placeOrder(ticker, side, qtyNum, reasoning || undefined, undefined, assetType);

            if (!result.success) {
                setMessage({ kind: "error", text: result.error ?? "Order failed." });
                return;
            }

            setMessage({ kind: "success", text: `Order submitted: ${result.order?.side} ${result.order?.qty} ${result.order?.ticker} (status: ${result.order?.status})` });
            setTicker("");
            setQty("");
            setReasoning("");
            router.refresh();
        });
    }

    function handleKillSwitch() {
        setMessage(null);
        startTransition(async () => {
            const result = await killSwitch();
            if (!result.success) {
                setMessage({ kind: "error", text: result.error ?? "Failed to cancel open orders." });
                return;
            }
            setMessage({ kind: "success", text: "All open orders cancelled." });
            router.refresh();
        });
    }

    return (
        <div className="space-y-4">

            <div className="flex items-center justify-between rounded-lg border border-emerald-900/40 bg-emerald-950/10 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <span className="flex h-2 w-2">
                        <span className={`absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 ${autoRefresh ? "animate-ping" : ""} opacity-75`} />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live — real Alpaca account, refreshed {lastRefreshed ? lastRefreshed.toLocaleTimeString() : "just now"}
                </div>
                <button
                    type="button"
                    onClick={() => setAutoRefresh(v => !v)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                    Auto-refresh: {autoRefresh ? "on (every 20s)" : "off"}
                </button>
            </div>

            <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
                <p className="text-xs text-amber-400">
                    Paper trading only — Alpaca&apos;s simulated environment, no real money. Orders are market/day orders sized against real live quotes, gated by hard risk limits (max position size, max concurrent positions, daily loss circuit breaker, minimum cash reserve) enforced in RiskEngine before anything reaches Alpaca. Options orders are sized at their real 100x contract multiplier — 1 contract represents 100 shares of exposure, not 1.
                </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Account</h3>
                {accountError ? (
                    <p className="text-sm text-red-400">{accountError}</p>
                ) : account ? (
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div>
                            <p className="text-xs text-zinc-500">Equity</p>
                            <p className="text-zinc-200">${account.equity.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Cash</p>
                            <p className="text-zinc-200">${account.cash.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Buying power</p>
                            <p className="text-zinc-200">${account.buyingPower.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Status</p>
                            <p className={account.tradingBlocked ? "text-red-400" : "text-emerald-400"}>
                                {account.tradingBlocked ? "Blocked" : "Active"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-zinc-600">Loading…</p>
                )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Place order</h3>
                <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
                    <div>
                        <label className="mb-1 block text-xs text-zinc-500">Asset Type</label>
                        <select
                            value={assetType}
                            onChange={e => setAssetType(e.target.value as "equity" | "option")}
                            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                        >
                            <option value="equity">Equity</option>
                            <option value="option">Option</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-zinc-500">
                            {assetType === "option" ? "Contract Symbol" : "Ticker"}
                        </label>
                        <input
                            value={ticker}
                            onChange={e => setTicker(e.target.value)}
                            placeholder={assetType === "option" ? "AAPL260320C00220000" : "AMD"}
                            className={assetType === "option" ? "w-48 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white" : "w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-zinc-500">Side</label>
                        <select
                            value={side}
                            onChange={e => setSide(e.target.value as OrderSide)}
                            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                        >
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-zinc-500">
                            {assetType === "option" ? "Qty (contracts)" : "Qty (shares)"}
                        </label>
                        <input
                            value={qty}
                            onChange={e => setQty(e.target.value)}
                            type="number"
                            min="1"
                            step="1"
                            className="w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                            required
                        />
                    </div>
                    <div className="min-w-[200px] flex-1">
                        <label className="mb-1 block text-xs text-zinc-500">Reasoning (optional)</label>
                        <input
                            value={reasoning}
                            onChange={e => setReasoning(e.target.value)}
                            placeholder="Link to the conviction behind this order"
                            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                        {isPending ? "Submitting…" : "Submit order"}
                    </button>
                    <button
                        type="button"
                        onClick={handleKillSwitch}
                        disabled={isPending}
                        className="rounded-md border border-red-900 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                    >
                        Cancel all open orders
                    </button>
                </form>

                {message && (
                    <p className={`mt-3 text-sm ${message.kind === "error" ? "text-red-400" : "text-emerald-400"}`}>
                        {message.text}
                    </p>
                )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Positions</h3>
                {positionsError ? (
                    <p className="text-sm text-red-400">{positionsError}</p>
                ) : positions.length === 0 ? (
                    <p className="text-sm text-zinc-600">No open positions.</p>
                ) : (
                    <div className="space-y-1">
                        {positions.map(p => (
                            <div key={p.ticker} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300">{p.ticker}</span>
                                <span className="text-zinc-500">{p.qty} sh @ ${p.avgEntryPrice.toFixed(2)}</span>
                                <span className="text-zinc-500">${p.marketValue.toLocaleString()}</span>
                                <span className={p.unrealizedPl >= 0 ? "text-emerald-400" : "text-red-400"}>
                                    {p.unrealizedPl >= 0 ? "+" : ""}${p.unrealizedPl.toFixed(2)} ({p.unrealizedPlPercent.toFixed(1)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Recent orders</h3>
                {ordersError ? (
                    <p className="text-sm text-red-400">{ordersError}</p>
                ) : orders.length === 0 ? (
                    <p className="text-sm text-zinc-600">No orders yet.</p>
                ) : (
                    <div className="space-y-1">
                        {orders.map(o => (
                            <div key={o.brokerOrderId} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300">{o.side.toUpperCase()} {o.qty} {o.ticker}</span>
                                <span className="text-zinc-500">{o.status}</span>
                                <span className="text-zinc-600">{new Date(o.submittedAt).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
