import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function AnalystEvidenceCards({ research }: WorkstationPanelProps) {
    const voting = research.committee.reports.filter(r => r.confidence > 0);

    if (voting.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Analyst Evidence</h3>
                <p className="text-xs text-zinc-600">No analysts with verified opinions yet.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Analyst Evidence</h3>
            <div className="space-y-2">
                {voting.map(r => (
                    <div key={r.analyst} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5">
                        <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-300">{r.analyst}</span>
                            <span className="text-zinc-500">{r.confidence}% confidence</span>
                        </div>
                        <p className="text-[11px] text-zinc-500">{r.thesis}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
