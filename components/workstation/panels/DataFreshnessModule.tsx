import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function DataFreshnessModule({ research }: WorkstationPanelProps) {
    const evidence = research.report.evidence;
    const categories = ["financial", "management", "ipo", "market", "industry", "news", "sec", "quote"] as const;

    const rows = categories.map(key => {
        const items = Object.values(evidence[key]) as { verified: boolean; collectedAt: Date | string; source: string }[];
        const verifiedItems = items.filter(i => i.verified);
        const mostRecent = verifiedItems.length > 0
            ? verifiedItems.reduce((latest, i) => new Date(i.collectedAt) > new Date(latest.collectedAt) ? i : latest)
            : null;
        return { key, verified: verifiedItems.length, total: items.length, mostRecent };
    });

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Data Freshness</h3>
            <div className="space-y-1.5">
                {rows.map(r => (
                    <div key={r.key} className="flex items-center justify-between text-xs">
                        <span className="capitalize text-zinc-400">{r.key}</span>
                        <span className="text-zinc-600">
                            {r.mostRecent
                                ? `${r.mostRecent.source} · ${new Date(r.mostRecent.collectedAt).toLocaleDateString()}`
                                : "not collected"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
