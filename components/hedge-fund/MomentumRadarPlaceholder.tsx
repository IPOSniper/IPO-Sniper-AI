import { getMomentumObservations } from "@/app/(app)/hedge-fund/momentum/actions";

const STAGES = ["EARLY", "DEVELOPING", "CONFIRMED", "FADING"];

export default async function MomentumRadarPlaceholder() {
    const observations = await getMomentumObservations();
    const hasData = observations.length > 0;

    const byStage = STAGES.map(stage => ({
        stage,
        rows: observations.filter(o => o.stage === stage),
    }));

    return (
        <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Momentum Radar</p>
                <span className="text-[10px] text-zinc-700">
                    {hasData ? `Real -- ${observations.length} tracked` : "Monitoring -- no observations yet"}
                </span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-[10px] uppercase text-zinc-600">
                            <th className="pb-1 font-medium">Ticker</th>
                            <th className="pb-1 font-medium">Stage</th>
                            <th className="pb-1 font-medium">Price</th>
                            <th className="pb-1 font-medium">RVOL</th>
                            <th className="pb-1 font-medium">Change</th>
                            <th className="pb-1 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {byStage.map(({ stage, rows }) => (
                            rows.length > 0 ? (
                                rows.map(o => (
                                    <tr key={o.id} className="border-t border-zinc-800 text-zinc-300">
                                        <td className="py-1.5 font-medium text-white">{o.ticker}</td>
                                        <td className="py-1.5">{stage}</td>
                                        <td className="py-1.5">{o.latestClose !== null ? `$${o.latestClose.toFixed(2)}` : "--"}</td>
                                        <td className="py-1.5">{o.rvol !== null ? `${o.rvol.toFixed(2)}x` : "--"}</td>
                                        <td className={`py-1.5 ${o.priceChangePercent !== null && o.priceChangePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {o.priceChangePercent !== null ? `${o.priceChangePercent >= 0 ? "+" : ""}${o.priceChangePercent.toFixed(2)}%` : "--"}
                                        </td>
                                        <td className="py-1.5 text-zinc-500">
                                            {new Date(o.lastSeenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr key={stage} className="border-t border-zinc-800 text-zinc-700">
                                    <td className="py-1.5">----</td>
                                    <td className="py-1.5">{stage}</td>
                                    <td className="py-1.5">--</td>
                                    <td className="py-1.5">--</td>
                                    <td className="py-1.5">--</td>
                                    <td className="py-1.5">--</td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>
                <p className="mt-2 text-[11px] text-zinc-700">
                    {hasData
                        ? "Real, persisted momentum observations from the quant-momentum cron. Refreshes on page load."
                        : "No momentum observations persisted yet -- the quant-momentum cron may not have run, or no opportunities table tickers have qualified yet. No fabricated prices or scores."}
                </p>
            </div>
        </div>
    );
}