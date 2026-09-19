import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function MarginTrendModule({ research }: WorkstationPanelProps) {
    const statements = research.report.evidence.financialStatements.statements.value;

    if (!statements || statements.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Margin Trend</h3>
                <p className="text-xs text-zinc-600">No verified financial statements for this ticker.</p>
            </div>
        );
    }

    const rows = statements.map(s => ({
        year: s.fiscalYear,
        gross: s.revenue ? (s.grossProfit / s.revenue) * 100 : null,
        operating: s.revenue ? (s.operatingIncome / s.revenue) * 100 : null,
        net: s.revenue ? (s.netIncome / s.revenue) * 100 : null,
    }));

    const maxAbs = Math.max(1, ...rows.flatMap(r => [r.gross, r.operating, r.net].filter((v): v is number => v !== null).map(Math.abs)));

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Margin Trend</h3>
                <div className="flex gap-3 text-[10px]">
                    <span className="text-emerald-400">Gross</span>
                    <span className="text-blue-400">Operating</span>
                    <span className="text-violet-400">Net</span>
                </div>
            </div>
            <div className="flex items-end gap-2 h-32">
                {rows.map(r => (
                    <div key={r.year} className="flex flex-1 flex-col items-center gap-0.5">
                        <div className="flex h-full items-end gap-0.5">
                            {r.gross !== null && <div className="w-1.5 bg-emerald-500 rounded-t" style={{ height: `${(Math.abs(r.gross) / maxAbs) * 100}%` }} />}
                            {r.operating !== null && <div className="w-1.5 bg-blue-500 rounded-t" style={{ height: `${(Math.abs(r.operating) / maxAbs) * 100}%` }} />}
                            {r.net !== null && <div className="w-1.5 bg-violet-500 rounded-t" style={{ height: `${(Math.abs(r.net) / maxAbs) * 100}%` }} />}
                        </div>
                        <span className="text-[9px] text-zinc-600">{r.year}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
