function MetricSkeleton({ label }: { label: string }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-600">{label}</p>
            <div className="mt-1 h-2 w-3/4 rounded bg-zinc-800" />
        </div>
    );
}

function EquityCurveSkeleton() {
    return (
        <svg viewBox="0 0 200 60" className="h-24 w-full">
            <polyline
                points="0,50 20,48 40,45 60,40 80,42 100,30 120,32 140,20 160,22 180,10 200,12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-zinc-700"
            />
        </svg>
    );
}

function ExecutionFunnelSkeleton() {
    const bars = [100, 80, 55, 30, 10];
    return (
        <div className="flex h-24 items-end gap-2">
            {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-zinc-800" style={{ height: `${h}%` }} />
            ))}
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
                <div className="mt-3 rounded border border-zinc-800 p-2">
                    <p className="mb-1 text-[10px] text-zinc-600">Equity Curve -- Layer 2 pending</p>
                    <EquityCurveSkeleton />
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
                <div className="mt-3 rounded border border-zinc-800 p-2">
                    <p className="mb-1 text-[10px] text-zinc-600">Execution Funnel -- Layer 2 pending</p>
                    <ExecutionFunnelSkeleton />
                </div>
            </div>
        </div>
    );
}