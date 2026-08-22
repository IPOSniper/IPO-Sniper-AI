export default function SystemStatusBar() {
    const blocks = [
        { label: "Session", value: "Regular" },
        { label: "Quant", value: "Autonomous" },
        { label: "Intelligence", value: "Live" },
        { label: "Data", value: "Healthy" },
        { label: "Portfolio", value: "Active" },
        { label: "Updated", value: "--" },
    ];
    return (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {blocks.map(b => (
                <div key={b.label} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">{b.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{b.value}</p>
                </div>
            ))}
        </div>
    );
}