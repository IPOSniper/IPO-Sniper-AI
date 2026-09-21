import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const BAR_AREA_PX = 96;

function formatBillions(value: number): string {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
}

/**
 * Total assets vs total liabilities per fiscal year. This tile used to plot
 * revenue and was labelled "(Revenue Proxy)", which duplicated the growth
 * tile. Fixed pixel heights (percentage heights collapsed to 0). A value of
 * 0 means the filing's tag was not mapped, so it is drawn as a gap.
 */
export default function BalanceSheetTrend({ research }: WorkstationPanelProps) {
    const statements = research.report.evidence.financialStatements.statements.value;

    if (!statements || statements.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Balance Sheet Trend</h3>
                <p className="text-xs text-zinc-600">No verified financial statements for this ticker.</p>
            </div>
        );
    }

    const rows = [...statements]
        .sort((a, b) => a.fiscalYear - b.fiscalYear)
        .map((s, i) => ({
            key: `${s.fiscalYear}-${i}`,
            year: s.fiscalYear,
            assets: s.totalAssets > 0 ? s.totalAssets : null,
            liabilities: s.totalLiabilities > 0 ? s.totalLiabilities : null,
        }));

    const max = Math.max(0, ...rows.flatMap(r => [r.assets, r.liabilities].filter((v): v is number => v !== null)));

    if (max === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Balance Sheet Trend</h3>
                <p className="text-xs text-zinc-600">No total assets or liabilities reported in these filings.</p>
            </div>
        );
    }

    const bar = (value: number | null, color: string, label: string) => {
        if (value === null) return <div className="w-2" />;
        const height = Math.max(2, Math.round((value / max) * BAR_AREA_PX));
        return <div className={`w-2 rounded-t ${color}`} style={{ height }} title={`${label}: ${formatBillions(value)}`} />;
    };

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Balance Sheet Trend</h3>
                <div className="flex gap-3 text-[10px]">
                    <span className="text-blue-400">Assets</span>
                    <span className="text-amber-400">Liabilities</span>
                </div>
            </div>
            <div className="flex items-end gap-1">
                {rows.map(r => (
                    <div key={r.key} className="flex flex-1 flex-col items-center gap-0.5" title={String(r.year)}>
                        <div className="flex items-end justify-center gap-0.5" style={{ height: BAR_AREA_PX }}>
                            {bar(r.assets, "bg-blue-500", "Assets")}
                            {bar(r.liabilities, "bg-amber-500", "Liabilities")}
                        </div>
                        <span className="text-[9px] text-zinc-600">{String(r.year).slice(-2)}</span>
                    </div>
                ))}
            </div>
            <p className="mt-2 text-[10px] text-zinc-700">Gaps = value not reported for that year. Peak {formatBillions(max)}.</p>
        </div>
    );
}
