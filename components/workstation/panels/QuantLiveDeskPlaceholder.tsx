export default function QuantLiveDeskPlaceholder() {
    const funnel = [
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
                {funnel.map(f => (
                    <div key={f.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">{f.label}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{f.value}</p>
                    </div>
                ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-500">Quant Funnel</p>
                    <p className="mt-2 text-sm text-zinc-600">Connecting in Layer 2...</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-500">Latest Opportunities</p>
                    <p className="mt-2 text-sm text-zinc-600">Connecting in Layer 2...</p>
                </div>
            </div>
        </div>
    );
}