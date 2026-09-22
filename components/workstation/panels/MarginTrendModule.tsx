import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const BAR_AREA_PX = 96;
const HALF_PX = BAR_AREA_PX / 2;

/**
 * Bar heights are fixed pixel values, not percentages. The previous version
 * used height: "NN%" inside flex items whose own height was content-sized, so
 * every percentage resolved to 0 and only the year labels were visible.
 * Positive margins grow up from the baseline, negative ones down (red).
 * Years with no revenue are gaps, never plotted as 0. The scale is capped at
 * 100% so one extreme year cannot flatten the rest.
 */
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

    const rows = [...statements]
        .sort((a, b) => a.fiscalYear - b.fiscalYear)
        .map((s, i) => ({
            key: `${s.fiscalYear}-${i}`,
            year: s.fiscalYear,
            gross: s.revenue ? (s.grossProfit / s.revenue) * 100 : null,
            operating: s.revenue ? (s.operatingIncome / s.revenue) * 100 : null,
            net: s.revenue ? (s.netIncome / s.revenue) * 100 : null,
        }));

    const maxAbs = Math.max(
        5,
        ...rows.flatMap(r => [r.gross, r.operating, r.net].filter((v): v is number => v !== null).map(v => Math.abs(v)))
    );
    const scale = Math.min(100, maxAbs);

    const segment = (value: number | null, color: string, label: string, dir: "up" | "down") => {
        if (value === null || (value >= 0) !== (dir === "up")) return <div className="w-1.5" />;
        const height = Math.min(HALF_PX, Math.max(2, Math.round((Math.abs(value) / scale) * HALF_PX)));
        return (
            <div
                className={`w-1.5 ${dir === "up" ? "rounded-t" : "rounded-b"} ${value < 0 ? "bg-red-500" : color}`}
                style={{ height }}
                title={`${label}: ${value.toFixed(1)}%`}
            />
        );
    };

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
            <div className="flex overflow-x-auto gap-1">
                {rows.map(r => (
                    <div key={r.key} className="flex min-w-0 flex-1 flex-col items-center gap-0.5" title={String(r.year)}>
                        <div className="flex flex-col" style={{ height: BAR_AREA_PX }}>
                            <div className="flex items-end justify-center gap-0.5" style={{ height: HALF_PX }}>
                                {segment(r.gross, "bg-emerald-500", "Gross", "up")}
                                {segment(r.operating, "bg-blue-500", "Operating", "up")}
                                {segment(r.net, "bg-violet-500", "Net", "up")}
                            </div>
                            <div className="flex items-start justify-center gap-0.5 border-t border-zinc-800" style={{ height: HALF_PX }}>
                                {segment(r.gross, "bg-emerald-500", "Gross", "down")}
                                {segment(r.operating, "bg-blue-500", "Operating", "down")}
                                {segment(r.net, "bg-violet-500", "Net", "down")}
                            </div>
                        </div>
                        <span className="text-[9px] text-zinc-600">{String(r.year).slice(-2)}</span>
                    </div>
                ))}
            </div>
            <p className="mt-2 text-[10px] text-zinc-700">Gaps = revenue not reported for that year. Scale capped at 100%.</p>
        </div>
    );
}
