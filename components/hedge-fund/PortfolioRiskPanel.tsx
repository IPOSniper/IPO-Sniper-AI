import type { PortfolioRiskReport, CommitteeStanceLabel } from "@/engine/portfolio/PortfolioRiskAggregator";

/**
 * Pure presentational panel for a PortfolioRiskReport. No data
 * fetching here — the page loads the report via the server action
 * and passes it in, same separation as the research Workstation
 * panels (WorkstationPanelProps pattern).
 */

interface PortfolioRiskPanelProps {
    report: PortfolioRiskReport;
}

const STANCE_COLOR: Record<CommitteeStanceLabel, string> = {
    Bullish: "text-emerald-400",
    Bearish: "text-red-400",
    Mixed: "text-amber-400",
    Neutral: "text-zinc-400",
};

function formatCurrency(value: number): string {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function PortfolioRiskPanel({ report }: PortfolioRiskPanelProps) {

    const { positions, failed, concentration, topRisks, committeeStance, totalMarketValue } = report;

    return (
        <div className="space-y-4">

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Portfolio Risk</h2>
                    <span className="text-xs text-zinc-600">
                        Arithmetic over real per-ticker committee output — not a trading signal
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-zinc-950 p-3">
                        <p className="mb-1 text-xs text-zinc-500">Tracked Market Value</p>
                        <p className="text-lg font-semibold text-white">{formatCurrency(totalMarketValue)}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-950 p-3">
                        <p className="mb-1 text-xs text-zinc-500">Committee Stance</p>
                        <p className={`text-lg font-semibold ${STANCE_COLOR[committeeStance.label]}`}>
                            {committeeStance.label}
                        </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950 p-3">
                        <p className="mb-1 text-xs text-zinc-500">Positions Analyzed</p>
                        <p className="text-lg font-semibold text-white">
                            {positions.length}{failed.length > 0 && (
                                <span className="ml-1 text-sm font-normal text-amber-500">
                                    ({failed.length} failed)
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="mb-1 text-xs text-zinc-500">
                        Committee Weight — Buy {committeeStance.buyWeight.toFixed(0)}% ·
                        {" "}Hold {committeeStance.holdWeight.toFixed(0)}% ·
                        {" "}Reduce/Sell {committeeStance.reduceWeight.toFixed(0)}%
                    </p>
                    <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div className="bg-emerald-500" style={{ width: `${committeeStance.buyWeight}%` }} />
                        <div className="bg-zinc-600" style={{ width: `${committeeStance.holdWeight}%` }} />
                        <div className="bg-red-500" style={{ width: `${committeeStance.reduceWeight}%` }} />
                    </div>
                </div>
            </div>

            {failed.length > 0 && (
                <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
                    <p className="mb-2 text-sm font-medium text-amber-400">Couldn't analyze {failed.length} position{failed.length > 1 ? "s" : ""}</p>
                    <ul className="space-y-1 text-sm text-zinc-400">
                        {failed.map(f => (
                            <li key={f.ticker}>
                                <span className="font-medium text-zinc-300">{f.ticker}</span> — {f.reason}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Concentration</h3>
                {concentration.length === 0 ? (
                    <p className="text-sm text-zinc-600">No priced positions.</p>
                ) : (
                    <div className="space-y-2">
                        {concentration.map(c => (
                            <div key={c.ticker} className="flex items-center gap-3">
                                <span className="w-16 text-sm text-zinc-300">{c.ticker}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                        className={c.flagged ? "h-full bg-amber-500" : "h-full bg-zinc-500"}
                                        style={{ width: `${Math.min(c.weight, 100)}%` }}
                                    />
                                </div>
                                <span className="w-14 text-right text-sm text-zinc-400">{c.weight.toFixed(1)}%</span>
                                {c.flagged && (
                                    <span className="text-xs text-amber-500">large</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Top Risks</h3>
                {topRisks.length === 0 ? (
                    <p className="text-sm text-zinc-600">No committee-flagged risks.</p>
                ) : (
                    <div className="space-y-2.5">
                        {topRisks.map((r, i) => (
                            <div key={`${r.ticker}-${i}`}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="text-zinc-300">
                                        <span className="text-zinc-500">{r.ticker}</span> — {r.title}
                                    </span>
                                    <span className="text-zinc-500">{r.severity}/100</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${r.severity}%`,
                                            backgroundColor: r.severity >= 75 ? "#F04452" : r.severity >= 50 ? "#F5A524" : "#16D47B",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Positions</h3>
                <div className="space-y-1">
                    {positions.map(p => (
                        <div key={p.ticker} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300">{p.ticker}</span>
                            <span className="text-zinc-500">{p.recommendation}</span>
                            <span className="text-zinc-400">{formatCurrency(p.marketValue)}</span>
                            <span className="text-zinc-500">{p.weight.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
