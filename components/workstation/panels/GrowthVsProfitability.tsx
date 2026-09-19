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

    const xMin = Math.min(...points.map(p => p.growth), 0);
    const xMax = Math.max(...points.map(p => p.growth), 1);
    const yMin = Math.min(...points.map(p => p.margin), 0);
    const yMax = Math.max(...points.map(p => p.margin), 1);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Growth vs. Profitability</h3>
            <div className="relative h-48 w-full">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <line x1="0" y1="100" x2="100" y2="100" stroke="#27272a" strokeWidth="0.5" />
                    <line x1="0" y1="0" x2="0" y2="100" stroke="#27272a" strokeWidth="0.5" />
                    {points.map(p => {
                        const x = ((p.growth - xMin) / xRange) * 100;
                        const y = 100 - ((p.margin - yMin) / yRange) * 100;
                        return (
                            <circle key={p.year} cx={x} cy={y} r="1.8" fill={p.growth >= 0 ? "#10b981" : "#ef4444"} />
                        );
                    })}
                </svg>
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-zinc-600">
                <span>Growth {xMin.toFixed(0)}% → {xMax.toFixed(0)}%</span>
                <span>Margin {yMin.toFixed(0)}% → {yMax.toFixed(0)}%</span>
            </div>
        </div>
    );
}
