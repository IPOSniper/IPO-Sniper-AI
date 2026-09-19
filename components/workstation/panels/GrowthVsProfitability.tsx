import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function GrowthVsProfitability({ research }: WorkstationPanelProps) {
    const statements = research.report.evidence.financialStatements.statements.value;

    if (!statements || statements.length < 2) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Growth vs. Profitability</h3>
                <p className="text-xs text-zinc-600">Not enough periods to compute growth.</p>
            </div>
        );
    }

    const points = statements.slice(1).map((s, i) => {
        const prev = statements[i];
        const growth = prev.revenue ? ((s.revenue - prev.revenue) / prev.revenue) * 100 : 0;
        const margin = s.revenue ? (s.netIncome / s.revenue) * 100 : 0;
        return { year: s.fiscalYear, growth, margin };
    });

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Growth vs. Profitability</h3>
            <div className="space-y-1.5">
                {points.map(p => (
                    <div key={p.year} className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500">{p.year}</span>
                        <span className={p.growth >= 0 ? "text-emerald-400" : "text-red-400"}>Growth {p.growth.toFixed(1)}%</span>
                        <span className={p.margin >= 0 ? "text-blue-400" : "text-red-400"}>Margin {p.margin.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
