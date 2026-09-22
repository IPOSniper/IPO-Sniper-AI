import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const BAR_AREA_PX = 96;
const HALF_PX = BAR_AREA_PX / 2;

/**
 * Year-over-year revenue growth. Fixed pixel heights (the old percentage
 * heights collapsed to 0). Growth is only computed between two consecutive
 * fiscal years that both have revenue, so a missing year shows as a gap
 * instead of a fake spike or drop.
 */
export default function GrowthTrendModule({ research }: WorkstationPanelProps) {
    const statements = research.report.evidence.financialStatements.statements.value;

    if (!statements || statements.length < 2) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Revenue Growth (YoY)</h3>
                <p className="text-xs text-zinc-600">Not enough verified periods to show a trend.</p>
            </div>
        );
    }

    const ordered = [...statements].sort((a, b) => a.fiscalYear - b.fiscalYear);
    const rows = ordered.map((s, i) => {
        const prev = i > 0 ? ordered[i - 1] : null;
        const growth =
            prev && s.fiscalYear === prev.fiscalYear + 1 && prev.revenue > 0 && s.revenue > 0
                ? ((s.revenue - prev.revenue) / prev.revenue) * 100
                : null;
        return { key: `${s.fiscalYear}-${i}`, year: s.fiscalYear, growth };
    });

    const hasAny = rows.some(r => r.growth !== null);
    if (!hasAny) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Revenue Growth (YoY)</h3>
                <p className="text-xs text-zinc-600">No two consecutive years with reported revenue.</p>
            </div>
        );
    }

    const maxAbs = Math.max(5, ...rows.map(r => (r.growth === null ? 0 : Math.abs(r.growth))));
    const scale = Math.min(100, maxAbs);

    const segment = (value: number | null, dir: "up" | "down") => {
        if (value === null || (value >= 0) !== (dir === "up")) return <div className="w-3" />;
        const height = Math.min(HALF_PX, Math.max(2, Math.round((Math.abs(value) / scale) * HALF_PX)));
        return (
            <div
                className={`w-3 ${dir === "up" ? "rounded-t" : "rounded-b"} ${value < 0 ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ height }}
                title={`${value.toFixed(1)}%`}
            />
        );
    };

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Revenue Growth (YoY)</h3>
            <div className="flex overflow-x-auto gap-1">
                {rows.map(r => (
                    <div key={r.key} className="flex min-w-0 flex-1 flex-col items-center gap-0.5" title={String(r.year)}>
                        <div className="flex flex-col" style={{ height: BAR_AREA_PX }}>
                            <div className="flex items-end justify-center" style={{ height: HALF_PX }}>
                                {segment(r.growth, "up")}
                            </div>
                            <div className="flex items-start justify-center border-t border-zinc-800" style={{ height: HALF_PX }}>
                                {segment(r.growth, "down")}
                            </div>
                        </div>
                        <span className="text-[9px] text-zinc-600">{String(r.year).slice(-2)}</span>
                    </div>
                ))}
            </div>
            <p className="mt-2 text-[10px] text-zinc-700">Gaps = missing or non-consecutive years. Scale capped at 100%.</p>
        </div>
    );
}
