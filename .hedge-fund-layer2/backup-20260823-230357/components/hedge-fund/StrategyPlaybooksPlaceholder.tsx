const STRATEGIES = ["Earnings", "Momentum", "Catalyst", "Post-Earnings", "IPO", "SEC", "After-Hours Stock", "Options"];

export default function StrategyPlaybooksPlaceholder() {
    return (
        <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Strategy / Playbooks</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STRATEGIES.map(s => (
                    <div key={s} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5">
                        <p className="text-xs text-zinc-500">{s}</p>
                        <p className="mt-1 text-[10px] text-zinc-700">Win rate: Unavailable</p>
                    </div>
                ))}
            </div>
            <p className="mt-1 text-[10px] text-zinc-700">No per-strategy tracking exists in the codebase yet -- this section is a placeholder for future work, not real data.</p>
        </div>
    );
}