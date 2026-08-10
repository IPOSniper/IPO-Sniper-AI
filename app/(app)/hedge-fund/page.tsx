import { getPositions, getPortfolioRisk } from "./actions";
import { getTradingAccount, getTradingPositions, getOrderHistory } from "./paper-trading/actions";
import PositionManager from "@/components/hedge-fund/PositionManager";
import PortfolioRiskPanel from "@/components/hedge-fund/PortfolioRiskPanel";
import PaperTradingPanel from "@/components/hedge-fund/PaperTradingPanel";
import SystemStatusPanel from "@/components/hedge-fund/SystemStatusPanel";

/**
 * Gated by proxy.ts (hedge_admin/admin roles) via the HEDGE_FUND_PREFIX
 * match on "/hedge-fund" — this route group is (app), so the URL is
 * still /hedge-fund even though the folder lives under app/(app)/.
 *
 * As of this pass: real research-based position tracking (unchanged),
 * PLUS a real live Alpaca paper-trading connection and an honest
 * system-status panel — see SystemStatusPanel.tsx's docstring for why
 * that panel shows real live/not-built status instead of a simulated
 * "Running" animation. See docs/HEDGE_FUND_ARCHITECTURE.md and
 * docs/MIGRATION_MATRIX.md for the full staging rationale.
 */
export default async function HedgeFundPage() {

    const positions = await getPositions();
    const risk = await getPortfolioRisk();
    const [accountResult, tradingPositionsResult, ordersResult] = await Promise.all([
        getTradingAccount(),
        getTradingPositions(),
        getOrderHistory(),
    ]);

    return (
        <div className="text-white">

            <h1 className="text-2xl font-bold mb-1">Hedge Fund</h1>
            <p className="text-zinc-400 mb-6">
                Real research-based position tracking, a live Alpaca paper-trading connection, and an honest
                status of what&apos;s actually automated versus not yet built.
            </p>

            <div className="mb-6">
                <SystemStatusPanel />
            </div>

            <div className="mb-6">
                <h2 className="mb-3 text-lg font-semibold">Paper Trading — Live Alpaca Connection</h2>
                <PaperTradingPanel
                    account={accountResult.account ?? null}
                    accountError={accountResult.error ?? null}
                    positions={tradingPositionsResult.positions ?? []}
                    positionsError={tradingPositionsResult.error ?? null}
                    orders={ordersResult.orders ?? []}
                    ordersError={ordersResult.error ?? null}
                />
            </div>

            <div className="mb-6 max-w-xl">
                <h2 className="mb-3 text-lg font-semibold">Research-Based Positions</h2>
                <PositionManager positions={positions} />
            </div>

            {risk.success && risk.report ? (
                <PortfolioRiskPanel report={risk.report} />
            ) : (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-sm text-zinc-400">
                        {positions.length === 0
                            ? "Add a position above to see portfolio risk."
                            : (risk.error ?? "Portfolio risk analysis is unavailable.")}
                    </p>
                </div>
            )}
        </div>
    );
}
