export default function ResearchSpotlightPlaceholder() {
    return (
        <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Research Spotlight</p>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold text-zinc-700">----</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold uppercase text-zinc-600">--</span>
                    <span className="text-xs text-zinc-700">-- % Model Confidence</span>
                    <span className="text-xs text-zinc-700">-- % Committee Agreement</span>
                    <span className="text-xs text-zinc-700">-- % Evidence Quality</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-600">-- Risk</span>
                </div>
                <p className="mt-3 text-xs text-zinc-700">No active research spotlight yet -- connecting in Layer 2.</p>
            </div>
        </div>
    );
}