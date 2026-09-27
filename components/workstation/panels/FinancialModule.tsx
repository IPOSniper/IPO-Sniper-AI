import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { MetricRow } from "../shared/MetricRow";

export default function FinancialModule({ research }: WorkstationPanelProps) {
    const f = research.report.evidence.financial;
    const hasRevenue = f.revenueGrowth?.verified;
    const hasMargin = f.grossMargin?.verified;
    const hasCash = f.cashAndEquivalents?.verified;
    const hasDebt = f.totalDebt?.verified;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Financial</h3>
            <MetricRow label="Revenue Growth" value={hasRevenue ? (f.revenueGrowth.value + "%") : "-"} status={hasRevenue ? undefined : "no data"} />
            <MetricRow label="Gross Margin" value={hasMargin ? (f.grossMargin.value + "%") : "-"} status={hasMargin ? undefined : "no data"} />
            <MetricRow label="Cash & Equivalents" value={hasCash ? ("$" + f.cashAndEquivalents.value) : "-"} status={hasCash ? undefined : "no data"} />
            <MetricRow label="Total Debt" value={hasDebt ? ("$" + f.totalDebt.value) : "-"} status={hasDebt ? undefined : "no data"} />
            {!hasRevenue && !hasMargin && (
                <p className="mt-2 text-[10px] text-zinc-600">Provider has not returned verified financials for this ticker yet.</p>
            )}
        </div>
    );
}
