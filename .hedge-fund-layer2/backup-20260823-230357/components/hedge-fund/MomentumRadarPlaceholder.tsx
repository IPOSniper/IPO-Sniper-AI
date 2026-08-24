const STAGES = ["EARLY", "DEVELOPING", "CONFIRMED", "FADING"];

export default function MomentumRadarPlaceholder() {
    return (
        <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Momentum Radar</p>
                <span className="text-[10px] text-zinc-700">Monitoring -- Layer 2 pending</span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-[10px] uppercase text-zinc-600">
                            <th className="pb-1 font-medium">Ticker</th>
                            <th className="pb-1 font-medium">Stage</th>
                            <th className="pb-1 font-medium">Price</th>
                            <th className="pb-1 font-medium">RVOL</th>
                            <th className="pb-1 font-medium">Catalyst</th>
                            <th className="pb-1 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STAGES.map(stage => (
                            <tr key={stage} className="border-t border-zinc-800 text-zinc-700">
                                <td className="py-1.5">----</td>
                                <td className="py-1.5">{stage}</td>
                                <td className="py-1.5">--</td>
                                <td className="py-1.5">--</td>
                                <td className="py-1.5">--</td>
                                <td className="py-1.5">--</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="mt-2 text-[11px] text-zinc-700">RVOL/acceleration/catalyst classification has no existing logic yet -- real computation is Hedge Fund Layer 2, not this pass. No fabricated prices or scores.</p>
            </div>
        </div>
    );
}