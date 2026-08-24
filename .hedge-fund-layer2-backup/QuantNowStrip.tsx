export default function QuantNowStrip() {
    const metrics = [
        { label: "Discovery", value: "--" },
        { label: "Decisions", value: "--" },
        { label: "Plans", value: "--" },
        { label: "Risk", value: "--" },
        { label: "Orders", value: "--" },
        { label: "Filled", value: "--" },
        { label: "Completed", value: "--" },
    ];
    return (
        <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Quant Now</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {metrics.map(m => (
                    <div key={m.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-600">{m.label}</p>
                        <p className="mt-1 text-lg font-semibold text-zinc-600">{m.value}</p>
                    </div>
                ))}
            </div>
            <p className="mt-1 text-[10px] text-zinc-700">Real numbers connected in Hedge Fund Layer 2 -- see detailed panels below for current real data.</p>
        </div>
    );
}