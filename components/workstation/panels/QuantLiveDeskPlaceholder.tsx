const FUNNEL_STEPS = ["Discovery", "Decisions", "Plans", "Risk", "Orders", "Fills"];
const SUMMARY_METRICS = [
    { label: "Discovery", barWidth: "w-full" },
    { label: "Decisions", barWidth: "w-full" },
    { label: "Plans", barWidth: "w-2/3" },
    { label: "Auto Gates", barWidth: "w-1/4" },
];

export default function QuantLiveDeskPlaceholder() {
    return (
        <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quant Live Desk</p>
                <span className="text-[10px] text-zinc-600">Autonomous -- Layer 2 pending</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {SUMMARY_METRICS.map(m => (
                    <div key={m.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">{m.label}</p>
                        <div className="mt-2 h-2 rounded bg-zinc-800">
                            <div className={`h-2 rounded bg-zinc-700 ${m.barWidth}`} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="mb-2 text-xs text-zinc-500">Funnel</p>
                    <div className="space-y-1.5">
                        {FUNNEL_STEPS.map((step, i) => (
                            <div key={step} className="flex items-center gap-2 text-sm">
                                <span className="w-20 shrink-0 text-zinc-400">{step}</span>
                                <div className="h-1.5 flex-1 rounded bg-zinc-800">
                                    <div
                                        className="h-1.5 rounded bg-zinc-700"
                                        style={{ width: `${100 - i * 12}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="mb-2 text-xs text-zinc-500">Latest Opportunities</p>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase text-zinc-600">
                                <th className="pb-1 font-medium">Ticker</th>
                                <th className="pb-1 font-medium">Score</th>
                                <th className="pb-1 font-medium">Catalyst</th>
                            </tr>
                        </thead>
                        <tbody className="text-zinc-700">
                            {["ADSK", "AFRM", "BBY", "RFAI"].map(t => (
                                <tr key={t} className="border-t border-zinc-800">
                                    <td className="py-1 text-zinc-500">{t}</td>
                                    <td className="py-1">--</td>
                                    <td className="py-1">--</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="mb-2 text-xs text-zinc-500">Quant Activity</p>
                <div className="space-y-1.5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                            <span className="w-12 shrink-0 text-zinc-600">--:--</span>
                            <div className="h-1.5 flex-1 max-w-xs rounded bg-zinc-800" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}