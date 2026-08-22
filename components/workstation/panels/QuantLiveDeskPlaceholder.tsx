const FUNNEL_STEPS = ["Discovery", "Decisions", "Plans", "Risk", "Orders", "Fills"];

export default function QuantLiveDeskPlaceholder() {
    const summary = [
        { label: "Discovery", value: "--" },
        { label: "Decisions", value: "--" },
        { label: "Plans", value: "--" },
        { label: "Auto Gates", value: "--" },
    ];
    return (
        <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quant Live Desk</p>
                <span className="text-[10px] text-zinc-600">Autonomous -- Layer 2 pending</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {summary.map(f => (
                    <div key={f.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">{f.label}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{f.value}</p>
                    </div>
                ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="mb-2 text-xs text-zinc-500">Quant Funnel</p>
                    <div className="space-y-1.5">
                        {FUNNEL_STEPS.map((step, i) => (
                            <div key={step} className="flex items-center gap-2 text-sm">
                                <span className="w-20 shrink-0 text-zinc-400">{step}</span>
                                <span className="text-zinc-700">--</span>
                                {i < FUNNEL_STEPS.length - 1 && <span className="ml-auto text-zinc-700">&darr;</span>}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="mb-2 text-xs text-zinc-500">Latest Opportunities</p>
                    <div className="space-y-1.5">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <span className="w-14 shrink-0 text-zinc-500">--</span>
                                <span className="w-10 shrink-0 text-zinc-600">--</span>
                                <span className="text-zinc-700">Awaiting data</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="mb-2 text-xs text-zinc-500">Quant Activity</p>
                <div className="space-y-1 text-sm text-zinc-700">
                    <p>-- Awaiting activity</p>
                    <p>-- Awaiting activity</p>
                    <p>-- Awaiting activity</p>
                </div>
            </div>
        </div>
    );
}