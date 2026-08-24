import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import UnverifiedCard from "../../shared/UnverifiedCard";

/**
 * Real engine output (InvestmentDecisionBuilder — PortfolioImpact-
 * Engine, CapitalRotationEngine, RiskRadarEngine, ScenarioEngine —
 * all fixed and working several rounds before this UI existed) that
 * had zero UI surface until now. IMPORTANT ABOUT SCOPE: cashTarget/
 * increaseExposure/reduceExposure are RESEARCH GUIDANCE derived from
 * committee conviction, not live position sizing against a real
 * portfolio — this app has no connected brokerage/holdings state.
 * Labeled accordingly below; don't let the polish imply more
 * precision than the underlying data has.
 */
export default function PortfolioIntelligence({ research }: WorkstationPanelProps) {
    const decision = research.investmentDecision;

    if (!decision) {
        return (
            <UnverifiedCard
                title="Portfolio Intelligence"
                reason="Investment decision data wasn't built for this research run."
            />
        );
    }

    const { portfolioImpact, capitalRotation, riskRadar, scenarios } = decision;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Portfolio Intelligence</h2>
                <span className="text-xs text-zinc-600">Research guidance, not live position sizing</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <p className="mb-2 text-sm font-medium text-emerald-400">Increase Exposure</p>
                    {portfolioImpact.increaseExposure.length === 0 ? (
                        <p className="text-sm text-zinc-600">None flagged.</p>
                    ) : (
                        <ul className="space-y-1 text-sm text-zinc-300">
                            {portfolioImpact.increaseExposure.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    )}
                </div>

                <div>
                    <p className="mb-2 text-sm font-medium text-red-400">Reduce Exposure</p>
                    {portfolioImpact.reduceExposure.length === 0 ? (
                        <p className="text-sm text-zinc-600">None flagged.</p>
                    ) : (
                        <ul className="space-y-1 text-sm text-zinc-300">
                            {portfolioImpact.reduceExposure.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-950 p-3">
                <span className="text-sm text-zinc-400">Suggested Allocation</span>
                <span className="text-sm font-semibold text-white">{portfolioImpact.cashTarget}% of sleeve</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-zinc-950 p-3">
                    <p className="mb-1 text-xs text-zinc-500">Bull Case ({scenarios.bull.probability}%)</p>
                    <p className="text-sm text-zinc-300">{scenarios.bull.summary}</p>
                </div>
                <div className="rounded-lg bg-zinc-950 p-3">
                    <p className="mb-1 text-xs text-zinc-500">Base Case ({scenarios.base.probability}%)</p>
                    <p className="text-sm text-zinc-300">{scenarios.base.summary}</p>
                </div>
                <div className="rounded-lg bg-zinc-950 p-3">
                    <p className="mb-1 text-xs text-zinc-500">Bear Case ({scenarios.bear.probability}%)</p>
                    <p className="text-sm text-zinc-300">{scenarios.bear.summary}</p>
                </div>
            </div>

            {(capitalRotation.winners.length > 0 || capitalRotation.losers.length > 0) && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {capitalRotation.winners.length > 0 && (
                        <div>
                            <p className="mb-1 text-xs text-zinc-500">Capital Rotation — Winners</p>
                            <p className="text-sm text-zinc-300">{capitalRotation.winners.join(", ")}</p>
                        </div>
                    )}
                    {capitalRotation.losers.length > 0 && (
                        <div>
                            <p className="mb-1 text-xs text-zinc-500">Capital Rotation — Losers</p>
                            <p className="text-sm text-zinc-300">{capitalRotation.losers.join(", ")}</p>
                        </div>
                    )}
                </div>
            )}

            {riskRadar.risks.length > 0 && (
                <div className="mt-4">
                    <p className="mb-1 text-xs text-zinc-500">Risk Radar</p>
                    <div className="space-y-1">
                        {riskRadar.risks.slice(0, 5).map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300">{r.title}</span>
                                <span className="text-zinc-500">{r.severity}/100</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
