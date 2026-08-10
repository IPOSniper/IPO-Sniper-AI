import { getPositions, getPortfolioRisk } from "./actions";
import PositionManager from "@/components/hedge-fund/PositionManager";
import PortfolioRiskPanel from "@/components/hedge-fund/PortfolioRiskPanel";

/**
 * Gated by proxy.ts (hedge_admin/admin roles) via the HEDGE_FUND_PREFIX
 * match on "/hedge-fund" — this route group is (app), so the URL is
 * still /hedge-fund even though the folder lives under app/(app)/.
 *
 * Zero trading logic on this page. It's a real dashboard over real
 * positions and real committee output — see
 * docs/HEDGE_FUND_ARCHITECTURE.md for why this, not execution, is
 * the recommended first slice of the Hedge Fund layer.
 */
export default async function HedgeFundPage() {

    const positions = await getPositions();
    const risk = await getPortfolioRisk();

    return (
        <div className="text-white">

            <h1 className="text-2xl font-bold mb-1">Hedge Fund</h1>
            <p className="text-zinc-400 mb-6">
                Portfolio risk aggregated from real per-ticker committee output. No trades are placed or sized here.
            </p>

            <div className="mb-6 max-w-xl">
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
