export default function PortfolioExecutionPlaceholder() {
    return (
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Portfolio</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <p className="text-zinc-600">Equity: --</p>
                    <p className="text-zinc-600">Day P&amp;L: --</p>
                    <p className="text-zinc-600">Total Return: --</p>
                    <p className="text-zinc-600">Positions: --</p>
                </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Execution</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <p className="text-zinc-600">Orders: --</p>
                    <p className="text-zinc-600">Filled: --</p>
                    <p className="text-zinc-600">Open Positions: --</p>
                    <p className="text-zinc-600">Completed: --</p>
                </div>
            </div>
        </div>
    );
}