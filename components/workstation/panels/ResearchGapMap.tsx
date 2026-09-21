import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * Each square previously showed only a color with no explanation of what the
 * color meant or how covered that category actually was -- unreadable without
 * inside knowledge. Now shows the real percentage on the square itself, plus
 * a legend spelling out the color thresholds.
 */
export default function ResearchGapMap({ research }: WorkstationPanelProps) {
    const evidence = research.report.evidence;
    const categories = ["financial", "management", "ipo", "market", "industry", "news", "sec", "quote"] as const;

    const rows = categories.map(key => {
        const items = Object.values(evidence[key]) as { verified: boolean }[];
        const verified = items.filter(i => i.verified).length;
        const total = items.length;
        const pct = total === 0 ? null : Math.round((verified / total) * 100);
        const status: "full" | "partial" | "missing" | "no-data" =
            total === 0 ? "no-data" : verified === total ? "full" : verified > 0 ? "partial" : "missing";
        return { key, status, pct, verified, total };
    });

    const color = { full: "bg-emerald-500", partial: "bg-amber-500", missing: "bg-red-500", "no-data": "bg-zinc-700" };
    const textColor = { full: "text-emerald-950", partial: "text-amber-950", missing: "text-red-50", "no-data": "text-zinc-400" };

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Research Gap Map</h3>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Fully verified</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-500" /> Partially verified</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-500" /> Not verified</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-zinc-700" /> No fields tracked</span>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {rows.map(r => (
                    <div key={r.key} className="flex flex-col items-center gap-1" title={r.total > 0 ? `${r.verified} of ${r.total} fields verified` : "No fields tracked for this category"}>
                        <div className={`flex h-10 w-10 items-center justify-center rounded text-[10px] font-semibold ${color[r.status]} ${textColor[r.status]}`}>
                            {r.pct !== null ? `${r.pct}%` : "-"}
                        </div>
                        <span className="text-[9px] capitalize text-zinc-500">{r.key}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}