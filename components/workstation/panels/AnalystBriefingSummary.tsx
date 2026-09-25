import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { getRecommendationLabel } from "@/engine/committee/shared/recommendationLabels";

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "text-emerald-400",
    BUY: "text-emerald-400",
    HOLD: "text-zinc-300",
    REDUCE: "text-amber-400",
    SELL: "text-red-400",
};

/**
 * Analyst Briefing Summary -- a real, deterministic synthesis of
 * every other real thing already computed elsewhere on this page,
 * assembled around the "what changed / why does it matter / what's
 * the evidence / what contradicts it / catalysts / risks / what's
 * expected / what to investigate next" framework. Same discipline
 * as ExecutiveSummaryPanel: only describes real, already-computed
 * values, never invents one, fails closed to honest omission rather
 * than a guessed number.
 *
 * HONEST SCOPE NOTE (v1, deterministic-only pass): "What changed"
 * and "What contradicts it" are answered by AdaptiveIntelligencePanel
 * elsewhere on the page (via assessTicker, which needs userId) --
 * that panel is rendered at the page.tsx level, not passed down
 * through WorkstationShell -> ResearchSession -> OperationsLayer
 * where this component lives. Wiring userId through that chain is
 * real, separate plumbing, deliberately not done in this pass to
 * avoid either a duplicate assessTicker call or a rushed prop-drill.
 * Those two questions are correctly, visibly omitted here for now,
 * not silently skipped.
 */
export default function AnalystBriefingSummary({ research }: WorkstationPanelProps) {
    const { report, committee, investmentDecision } = research;
    const { financial, quote, analystConsensus } = report.evidence;
    const color = RECOMMENDATION_COLOR[report.recommendation] ?? "text-zinc-300";

    // Real, fail-closed "why does it matter" formulas -- each is
    // independently gated on its own real, verified inputs. Neither
    // renders anything at all if its inputs aren't real and verified.
    const canComputeRunway =
        financial.freeCashFlow.verified &&
        financial.freeCashFlow.value < 0 &&
        financial.cashAndEquivalents.verified &&
        financial.cashAndEquivalents.value > 0;
    const monthlyBurn = canComputeRunway ? Math.abs(financial.freeCashFlow.value) / 12 : null;
    const runwayMonths = canComputeRunway && monthlyBurn && monthlyBurn > 0
        ? financial.cashAndEquivalents.value / monthlyBurn
        : null;

    const canComputeLeverage =
        financial.totalDebt.verified &&
        financial.totalDebt.value > 0 &&
        quote.marketCap.verified &&
        quote.marketCap.value > 0;
    const debtToMarketCap = canComputeLeverage ? financial.totalDebt.value / quote.marketCap.value : null;

    const hasWhyItMatters = runwayMonths !== null || debtToMarketCap !== null;

    const consensusTotal = analystConsensus.strongBuy.value + analystConsensus.buy.value +
        analystConsensus.hold.value + analystConsensus.sell.value + analystConsensus.strongSell.value;
    const hasConsensus = analystConsensus.strongBuy.verified && consensusTotal > 0;

    const nextSteps = investmentDecision
        ? investmentDecision.riskRadar.risks.slice(0, 3).map(r => r.title)
        : [];

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-200">Analyst Briefing Summary</h2>
                <span className={`text-sm font-bold ${color}`}>{getRecommendationLabel(report.recommendation)}</span>
            </div>

            <div className="mb-4 flex gap-6 border-b border-zinc-800 pb-4 text-sm">
                <div><span className="text-zinc-500">Conviction </span><span className="font-medium text-white">{report.conviction}/100</span></div>
                <div><span className="text-zinc-500">Confidence </span><span className="font-medium text-white">{report.confidence}%</span></div>
                <div><span className="text-zinc-500">Agreement </span><span className="font-medium text-white">{committee.agreement}%</span></div>
            </div>

            <div className="space-y-4 text-sm">
                <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">What's the evidence?</p>
                    <a href="#analysts" className="text-xs text-violet-400 hover:underline">See the full per-analyst evidence breakdown &rarr;</a>
                </div>

                {report.catalysts.length > 0 && (
                    <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">What are the catalysts?</p>
                        <ul className="space-y-0.5">
                            {report.catalysts.slice(0, 3).map((c, i) => (
                                <li key={i} className="text-xs text-zinc-300">- {c}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {hasWhyItMatters && (
                    <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Why does it matter?</p>
                        <ul className="space-y-0.5">
                            {runwayMonths !== null && (
                                <li className="text-xs text-amber-400">
                                    At the current real cash-burn rate, this company has approximately {runwayMonths.toFixed(1)} months of cash runway remaining.
                                </li>
                            )}
                            {debtToMarketCap !== null && (
                                <li className="text-xs text-zinc-300">
                                    Real total debt is {(debtToMarketCap * 100).toFixed(0)}% of the current market cap - a real, direct leverage-to-valuation comparison.
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {hasConsensus && (
                    <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">What is the market expecting?</p>
                        <p className="text-xs text-zinc-300">
                            {consensusTotal} real sell-side analyst{consensusTotal === 1 ? "" : "s"} covering this ticker
                            {analystConsensus.priceTargetMean.verified && ` - mean price target $${analystConsensus.priceTargetMean.value.toFixed(2)}`}.
                        </p>
                    </div>
                )}

                {nextSteps.length > 0 && (
                    <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">What should the analyst investigate next?</p>
                        <ul className="space-y-0.5">
                            {nextSteps.map((s, i) => <li key={i} className="text-xs text-zinc-300">- {s}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            <p className="mt-4 border-t border-zinc-800 pt-3 text-[10px] text-zinc-600">
                Deterministic synthesis - assembled directly from the real scores and findings computed elsewhere on this page, not AI-generated. &quot;What changed&quot; and &quot;What contradicts it&quot; are answered in the Adaptive Intelligence panel above.
            </p>
        </div>
    );
}