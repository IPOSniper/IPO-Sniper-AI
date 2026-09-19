import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function ResearchGapMap({ research }: WorkstationPanelProps) {
    const evidence = research.report.evidence;
    const categories = ["financial", "management", "ipo", "market", "industry", "news", "sec", "quote"] as const;

    const rows = categories.map(key => {
        const items = Object.values(evidence[key]) as { verified: boolean }[];
        const verified = items.filter(i => i.verified).length;
        const total = items.length;
        const status: "full" | "partial" | "missing" | "no-data" = total === 0 ? "no-data" : verified === total ? "full" : verified > 0 ? "partial" : "missing";
        return { key, status };
    });

    const color = { full: "bg-emerald-500", partial: "bg-amber-500", missing: "bg-red-500", "no-data": "bg-zinc-700" };

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Research Gap Map</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {rows.map(r => (
                    <div key={r.key} className="flex flex-col items-center gap-1">
                        <div className={`h-8 w-8 rounded ${color[r.status]}`} />
                        <span className="text-[9px] capitalize text-zinc-500">{r.key}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
