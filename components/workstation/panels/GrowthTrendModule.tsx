import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function GrowthTrendModule({ research }: WorkstationPanelProps) {
    const statements = research.report.evidence.financialStatements.statements.value;

    if (!statements || statements.length < 2) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Growth Trend</h3>
                <p className="text-xs text-zinc-600">Not enough verified periods to show a trend.</p>
            </div>
        );
    }

    const max = Math.max(...statements.map(s => s.revenue || 0), 1);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Revenue Growth Trend</h3>
            <div className="flex items-end gap-1.5 h-28">
                {statements.map(s => (
                    <div key={s.fiscalYear} className="flex flex-1 flex-col items-center gap-0.5">
                        <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${((s.revenue || 0) / max) * 100}%` }} />
                        <span className="text-[9px] text-zinc-600">{s.fiscalYear}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
