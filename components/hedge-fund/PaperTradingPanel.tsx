"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { placeOrder, killSwitch, getEquityQuoteForOrderForm } from "@/app/(app)/hedge-fund/paper-trading/actions";
import { findBestContract, browseOptionChain, type ContractRecommendation, type ChainDiagnostics } from "@/app/(app)/hedge-fund/contract-finder/actions";
import type { OptionContract } from "@/engine/trading/providers/AlpacaOptionsProvider";
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
    const [quote, setQuote] = useState<{ price: number; changePercent: number } | null>(null);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [checkingQuote, setCheckingQuote] = useState(false);
    const [findTicker, setFindTicker] = useState("");
    const [findDirection, setFindDirection] = useState<"call" | "put">("call");
    const [finderStatus, setFinderStatus] = useState<"idle" | "finding" | "error" | "not-found">("idle");
    const [recommendation, setRecommendation] = useState<ContractRecommendation | null>(null);
    const [diagnostics, setDiagnostics] = useState<ChainDiagnostics | null>(null);
    const [browsedContracts, setBrowsedContracts] = useState<OptionContract[] | null>(null);
    const [browsingChain, setBrowsingChain] = useState(false);
    const [browseError, setBrowseError] = useState<string | null>(null);
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

    async function handleCheckPrice() {
        setQuote(null);
        setQuoteError(null);
        setCheckingQuote(true);
        const result = await getEquityQuoteForOrderForm(ticker);
        setCheckingQuote(false);
        if (result.success && result.price !== undefined) {
            setQuote({ price: result.price, changePercent: result.changePercent ?? 0 });
        } else {
            setQuoteError(result.error ?? "Quote lookup failed.");
        }
    }

    async function handleFindContract() {
        setFinderStatus("finding");
        setRecommendation(null);
        setDiagnostics(null);

        const response = await findBestContract(findTicker, findDirection);
        if (!response.success) {
            setFinderStatus("error");
            return;
        }
        if (!response.recommendation) {
            setFinderStatus("not-found");
            setDiagnostics(response.diagnostics ?? null);
            return;
        }
        setRecommendation(response.recommendation);
        setFinderStatus("idle");
    }

    function handleUseContract() {
        if (!recommendation) return;
        setAssetType("option");
        setTicker(recommendation.contract.symbol);
        setQty(String(recommendation.estimatedQty));
        setSide("buy");
    }

    async function handleBrowseChain() {
        setBrowsedContracts(null);
        setBrowseError(null);
        setBrowsingChain(true);
        const response = await browseOptionChain(findTicker, findDirection);
        setBrowsingChain(false);
        if (!response.success || !response.contracts) {
            setBrowseError(response.error ?? "Failed to load the real chain.");
            return;
        }
        setBrowsedContracts(response.contracts);
    }

    function handlePickBrowsedContract(contract: OptionContract) {
        setAssetType("option");
        setTicker(contract.symbol);
        setSide("buy");
        setBrowsedContracts(null);
    }

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
                <h3 className="mb-1 text-sm font-medium text-zinc-300">Find Best Contract</h3>
                <p className="mb-3 text-[10px] text-zinc-600">
                    Real, shared logic — the same findMatchingContract() the Quant Strategist flow uses, with the same real standard DTE/Delta conventions, but without requiring the committee to agree first. Your own judgment, not blocked by the committee.
                </p>
                <div className="flex flex-wrap items-end gap-2">
                    <div>
                        <label className="mb-1 block text-xs text-zinc-500">Ticker</label>
                        <input
                            value={findTicker}
                            onChange={e => setFindTicker(e.target.value)}
                            placeholder="CSCO"
                            className="w-28 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-zinc-500">Strategy</label>
                        <select
                            value={findDirection}
                            onChange={e => setFindDirection(e.target.value as "call" | "put")}
                            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                        >
                            <option value="call">Buy Call</option>
                            <option value="put">Buy Put</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleFindContract}
                        disabled={finderStatus === "finding" || !findTicker.trim()}
                        className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                        {finderStatus === "finding" ? "Searching…" : "Find Best Contract"}
                    </button>
                </div>

                {finderStatus === "error" && <p className="mt-2 text-xs text-red-400">Could not search the real options chain — check the ticker.</p>}
                {finderStatus === "not-found" && (
                    <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
                        <p className="mb-2 text-zinc-500">No real contract in the live chain falls within the standard 35–45 DTE / 0.30–0.40 delta target — honest, not an error. Here's what the real chain actually has:</p>
                        {diagnostics && diagnostics.contractsOfDirection > 0 ? (
                            <div className="space-y-1 text-zinc-400">
                                <p>Real {findDirection}s available: {diagnostics.contractsOfDirection}</p>
                                {diagnostics.deltaRange && (
                                    <p>Real delta range in the chain: {diagnostics.deltaRange[0].toFixed(2)} – {diagnostics.deltaRange[1].toFixed(2)} (target was 0.30–0.40)</p>
                                )}
                                {diagnostics.availableExpirations.length > 0 && (
                                    <p>Real expirations available: {diagnostics.availableExpirations.slice(0, 6).join(", ")}{diagnostics.availableExpirations.length > 6 ? ` (+${diagnostics.availableExpirations.length - 6} more)` : ""}</p>
                                )}
                                <p className="mt-1 text-zinc-600">Pick a real contract from the actual chain below, or use the Options Chain panel on the research page.</p>
                                <button
                                    type="button"
                                    onClick={handleBrowseChain}
                                    disabled={browsingChain}
                                    className="mt-2 rounded-md border border-violet-800 px-3 py-1 text-[11px] text-violet-300 hover:bg-violet-950/40 disabled:opacity-50"
                                >
                                    {browsingChain ? "Loading real chain…" : "Browse real chain"}
                                </button>
                                {browseError && <p className="mt-1 text-red-400">{browseError}</p>}
                                {browsedContracts && (
                                    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                                        {browsedContracts.map(c => (
                                            <button
                                                type="button"
                                                key={c.symbol}
                                                onClick={() => handlePickBrowsedContract(c)}
                                                className="flex w-full items-center justify-between rounded-md bg-zinc-900 px-2 py-1.5 text-left hover:bg-zinc-800"
                                            >
                                                <span className="font-mono text-[10px] text-zinc-300">${c.strikePrice} · {c.expirationDate}</span>
                                                <span className="text-[10px] text-zinc-500">
                                                    {c.bidPrice !== null && c.askPrice !== null ? `$${c.bidPrice.toFixed(2)}/$${c.askPrice.toFixed(2)}` : "—"}
                                                    {c.delta !== null && ` · Δ${c.delta.toFixed(2)}`}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-zinc-600">The real chain has no {findDirection} contracts at all for this ticker right now.</p>
                        )}
                    </div>
                )}

                {recommendation && (
                    <div className="mt-3 rounded-lg border border-violet-900/40 bg-[#160B3D] p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-violet-300">Recommended Contract</p>
                        <p className="mb-2 select-all rounded bg-zinc-900 px-1.5 py-1 font-mono text-[10px] text-zinc-300">
                            {recommendation.contract.symbol}
                        </p>
                        <div className="mb-2 grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <p className="text-zinc-500">Strike / Exp.</p>
                                <p className="text-white">${recommendation.contract.strikePrice.toFixed(2)} · {recommendation.contract.expirationDate}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Delta / IV</p>
                                <p className="text-white">
                                    {recommendation.contract.delta?.toFixed(3) ?? "—"} / {recommendation.contract.impliedVolatility !== null ? `${(recommendation.contract.impliedVolatility * 100).toFixed(1)}%` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Bid / Ask</p>
                                <p className="text-white">
                                    {recommendation.contract.bidPrice !== null ? `$${recommendation.contract.bidPrice.toFixed(2)}` : "—"} / {recommendation.contract.askPrice !== null ? `$${recommendation.contract.askPrice.toFixed(2)}` : "—"}
                                </p>
                            </div>
                        </div>
                        <p className="mb-3 text-[10px] text-zinc-500">
                            Est. cost: {recommendation.estimatedQty} contract{recommendation.estimatedQty !== 1 ? "s" : ""} × real ask = ${recommendation.estimatedCost.toFixed(0)}. Real reason: closest real match to the standard 35–45 DTE / 0.30–0.40 delta target — not an arbitrary pick.
                        </p>
                        <button
                            type="button"
                            onClick={handleUseContract}
                            className="w-full rounded-md bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                        >
                            Use This Contract
                        </button>
                    </div>
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
                            onChange={e => { setTicker(e.target.value); setQuote(null); setQuoteError(null); }}
                            placeholder={assetType === "option" ? "AAPL260320C00220000" : "AMD"}
                            className={assetType === "option" ? "w-48 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white" : "w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"}
                            required
                        />
                        {assetType === "equity" && (
                            <div className="mt-1">
                                <button
                                    type="button"
                                    onClick={handleCheckPrice}
                                    disabled={!ticker.trim() || checkingQuote}
                                    className="text-[10px] text-violet-400 underline disabled:opacity-50"
                                >
                                    {checkingQuote ? "Checking…" : "Check real price"}
                                </button>
                                {quote && (
                                    <p className="text-[10px] text-zinc-400">
                                        ${quote.price.toFixed(2)}{" "}
                                        <span className={quote.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}>
                                            ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
                                        </span>
                                    </p>
                                )}
                                {quoteError && <p className="text-[10px] text-red-400">{quoteError}</p>}
                            </div>
                        )}
                        {assetType === "option" && (
                            <p className="mt-1 text-[10px] text-zinc-600">
                                Use &ldquo;Find Best Contract&rdquo; above, or check the Options Chain on the research page for real bid/ask — a direct per-contract quote isn&apos;t built into this form yet.
                            </p>
                        )}
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
