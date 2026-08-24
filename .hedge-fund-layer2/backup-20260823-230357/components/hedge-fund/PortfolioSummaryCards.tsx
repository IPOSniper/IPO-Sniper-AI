import type { TradingAccount, TradingPosition } from "@/engine/trading/contracts/TradeOrder";
import { DEFAULT_RISK_LIMITS } from "@/engine/trading/risk/RiskEngine";
import { getClosedTradesSummary } from "@/app/(app)/hedge-fund/closed-trades/actions";

/**
 * Real portfolio summary cards -- all 8 originally requested metrics.
 * "Win Rate" now uses real closed-trade data (see
 * closed-trades/actions.ts's real FIFO matching) when at least one
 * real closed trade exists -- previously permanently showed "—"
 * since no closure-detection existed. Still shows the honest "—"
 * placeholder when zero real closed trades exist yet, rather than
 * a fabricated 0%/100% that would misrepresent "no data" as "no
 * wins."
 *
 * "Total Unrealized P/L" (not "Today's P/L") -- TradingPosition only
 * has unrealizedPl since entry, not an isolated daily change. Named
 * for what's actually real rather than mislabeling it.
 */
export default async function PortfolioSummaryCards({
    account,
    positions,
}: {
    account: TradingAccount | null;
    positions: TradingPosition[];
}) {
    if (!account) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-2 text-sm font-medium text-zinc-300">Portfolio Summary</h3>
                <p className="text-sm text-zinc-600">Real account data unavailable.</p>
            </div>
        );
    }

    const closedSummary = await getClosedTradesSummary();

    const totalUnrealizedPl = positions.reduce((sum, p) => sum + p.unrealizedPl, 0);
    const largest = positions.length > 0
        ? [...positions].sort((a, b) => Math.abs(b.marketValue) - Math.abs(a.marketValue))[0]
        : null;
    const largestPercent = largest && account.equity > 0 ? (Math.abs(largest.marketValue) / account.equity) * 100 : 0;
    const maxAllowedPercent = DEFAULT_RISK_LIMITS.maxPositionSizePercent * 100;
    const riskBudgetRemaining = Math.max(0, maxAllowedPercent - largestPercent);

    const cards = [
        { label: "Portfolio Value", value: `$${account.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
        { label: "Cash", value: `$${account.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
        { label: "Buying Power", value: `$${account.buyingPower.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
        { label: "Total Unrealized P/L", value: `${totalUnrealizedPl >= 0 ? "+" : ""}$${totalUnrealizedPl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: totalUnrealizedPl >= 0 ? "text-emerald-400" : "text-red-400" },
        { label: "Open Positions", value: String(positions.length) },
        { label: "Largest Position (% of account)", value: largest ? `${largest.ticker} (${largestPercent.toFixed(1)}%)` : "—" },
        { label: "Risk Budget Remaining", value: `${riskBudgetRemaining.toFixed(1)}%` },
        closedSummary && closedSummary.totalTrades > 0
            ? { label: "Win Rate", value: `${closedSummary.winRate.toFixed(0)}%`, note: `${closedSummary.wins}W / ${closedSummary.losses}L, real closed trades` }
            : { label: "Win Rate", value: "—", note: "Needs at least one real closed trade" },
    ];

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Portfolio Summary</h3>
                <span className="text-[10px] text-zinc-600">Real, from live account + positions</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {cards.map(c => (
                    <div key={c.label} className="rounded-lg bg-zinc-950 p-3">
                        <p className="mb-1 text-[10px] text-zinc-500">{c.label}</p>
                        <p className={`text-sm font-semibold ${c.color ?? "text-white"}`}>{c.value}</p>
                        {c.note && <p className="mt-0.5 text-[9px] text-zinc-700">{c.note}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
