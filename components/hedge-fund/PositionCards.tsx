import type { TradingPosition } from "@/engine/trading/contracts/TradeOrder";
import type { PositionRiskResult } from "@/engine/portfolio/PortfolioRiskAggregator";

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "text-emerald-400 border-emerald-900/50",
    BUY: "text-emerald-400 border-emerald-900/50",
    HOLD: "text-zinc-300 border-zinc-800",
    REDUCE: "text-amber-400 border-amber-900/50",
    SELL: "text-red-400 border-red-900/50",
};

const RECOMMENDATION_SCORE: Record<string, number> = {
    STRONG_BUY: 100,
    BUY: 75,
    HOLD: 50,
    REDUCE: 25,
    SELL: 0,
};

/**
 * Real Position Health Score -- honestly composed of exactly 3 real
 * components (recommendation, conviction, risk severity), NOT the
 * originally-proposed 6 (Committee/Trend/Volatility/Evidence/Risk/
 * Liquidity). PositionRiskResult genuinely only carries
 * recommendation/conviction/risks -- no separate "evidence quality"
 * field exists at this level, and Trend/Volatility/Liquidity all
 * depend on the same broken candle-data source flagged repeatedly
 * this session. Building a 6-dimension score by inventing the other
 * 3 would misrepresent what this number actually measures.
 */
function healthScore(risk: PositionRiskResult): number {
    const recScore = RECOMMENDATION_SCORE[risk.recommendation] ?? 50;
    const avgSeverity = risk.risks.length > 0
        ? risk.risks.reduce((sum, r) => sum + r.severity, 0) / risk.risks.length
        : 0;
    const safetyScore = 100 - avgSeverity;
    return Math.round((recScore + risk.conviction + safetyScore) / 3);
}

function healthLabel(score: number): { label: string; color: string } {
    if (score >= 70) return { label: "Healthy", color: "text-emerald-400" };
    if (score >= 40) return { label: "Watch", color: "text-amber-400" };
    return { label: "At Risk", color: "text-red-400" };
}

/**
 * Real position cards -- no mini price chart, per direct decision:
 * PriceChart.tsx has a real, confirmed, still-unresolved limitation
 * ("Price history unavailable — check FINNHUB_API_KEY / plan access
 * to /stock/candle"), and building new charts against the same
 * uncertain data source risked repeating that failure.
 *
 * Merges two real, already-fetched sources by ticker -- neither
 * alone has everything a card needs: real Alpaca TradingPosition
 * (current price, entry price, real P/L) and the real committee-
 * based PositionRiskResult (portfolio weight, recommendation, real
 * flagged risks). A ticker present in one list but not the other
 * still renders, with the missing half shown as "—", not hidden.
 */
export default function PositionCards({
    tradingPositions,
    riskPositions,
}: {
    tradingPositions: TradingPosition[];
    riskPositions: PositionRiskResult[];
}) {
    const tickers = [...new Set([...tradingPositions.map(p => p.ticker), ...riskPositions.map(p => p.ticker)])];

    if (tickers.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Position Cards</h3>
                <p className="text-sm text-zinc-600">No open positions.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-1 text-sm font-medium text-zinc-300">Position Cards</h3>
            <p className="mb-3 text-[10px] text-zinc-600">Health score = recommendation + conviction + inverse risk severity (real). Excludes trend/volatility/liquidity — blocked by the same unresolved price-history limitation as PriceChart.tsx.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tickers.map(ticker => {
                    const trading = tradingPositions.find(p => p.ticker === ticker);
                    const risk = riskPositions.find(p => p.ticker === ticker);
                    const topRisk = risk?.risks?.[0];
                    const recColor = risk ? RECOMMENDATION_COLOR[risk.recommendation] ?? "text-zinc-300 border-zinc-800" : "text-zinc-300 border-zinc-800";

                    return (
                        <div key={ticker} className={`rounded-lg border bg-zinc-950 p-3 ${recColor.split(" ")[1]}`}>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="font-semibold text-white">{ticker}</span>
                                {risk && (
                                    <span className={`text-xs font-medium ${recColor.split(" ")[0]}`}>
                                        {risk.recommendation.replace("_", " ")}
                                    </span>
                                )}
                            </div>

                            <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="text-zinc-500">Current</p>
                                    <p className="text-white">{trading ? `$${trading.currentPrice.toFixed(2)}` : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500">Entry</p>
                                    <p className="text-white">{trading ? `$${trading.avgEntryPrice.toFixed(2)}` : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500">P/L</p>
                                    <p className={trading && trading.unrealizedPl >= 0 ? "text-emerald-400" : "text-red-400"}>
                                        {trading ? `${trading.unrealizedPl >= 0 ? "+" : ""}${trading.unrealizedPlPercent.toFixed(1)}%` : "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-zinc-500">Weight</p>
                                    <p className="text-white">{risk ? `${risk.weight.toFixed(1)}%` : "—"}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-zinc-500">Committee Conviction</p>
                                    <p className="text-white">{risk ? `${risk.conviction}/100` : "—"}</p>
                                </div>
                                {risk && (() => {
                                    const score = healthScore(risk);
                                    const { label, color } = healthLabel(score);
                                    return (
                                        <div className="col-span-2 flex items-center justify-between border-t border-zinc-800 pt-1.5">
                                            <span className="text-zinc-500">Health</span>
                                            <span className={`font-medium ${color}`}>{score}/100 — {label}</span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {topRisk && (
                                <p className="text-[10px] text-zinc-500">
                                    Top risk: {topRisk.title} <span className="text-zinc-600">({topRisk.severity}/100)</span>
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
