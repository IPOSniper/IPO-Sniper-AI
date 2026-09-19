import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function AnalystCoverageMatrix({ research }: WorkstationPanelProps) {
    const reports = research.committee.reports;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Analyst Coverage Matrix</h3>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {reports.map(r => (
                    <div
                        key={r.analyst}
                        className={`rounded px-2 py-2 text-center text-[10px] ${
                            r.confidence > 0 ? "bg-emerald-900/40 text-emerald-300" : "bg-zinc-900 text-zinc-600"
                        }`}
                        title={r.analyst}
                    >
                        <div className="truncate">{r.analyst.replace(" Analyst", "")}</div>
                        <div className="mt-0.5 font-semibold">{r.confidence > 0 ? `${r.confidence}%` : "-"}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
