function MetricSkeleton({ label }: { label: string }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-600">{label}</p>
            <div className="mt-1 h-2 w-3/4 rounded bg-zinc-800" />
        </div>
    );
}

export default function PortfolioExecutionPlaceholder() {
    return (
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Portfolio</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                    <MetricSkeleton label="Equity" />
                    <MetricSkeleton label="Day P&amp;L" />
                    <MetricSkeleton label="Total Return" />
                    <MetricSkeleton label="Drawdown" />
                </div>
                <div className="mt-3 flex h-24 items-center justify-center rounded border border-dashed border-zinc-800 text-xs text-zinc-700">
                    Equity Curve -- Layer 2 pending
                </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Execution</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                    <MetricSkeleton label="Orders" />
                    <MetricSkeleton label="Filled" />
                    <MetricSkeleton label="Open Positions" />
                    <MetricSkeleton label="Completed" />
                </div>
                <div className="mt-3 flex h-24 items-center justify-center rounded border border-dashed border-zinc-800 text-xs text-zinc-700">
                    Execution Funnel -- Layer 2 pending
                </div>
            </div>
        </div>
    );
}