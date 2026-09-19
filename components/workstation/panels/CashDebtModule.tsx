import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { DataBar } from "../design/DesignPrimitives";

export default function CashDebtModule({ research }: WorkstationPanelProps) {
    const f = research.report.evidence.financial;
    const cash = f.cashAndEquivalents;
    const debt = f.totalDebt;

    if (!cash.verified && !debt.verified) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Cash vs. Debt</h3>
                <p className="text-xs text-zinc-600">No verified balance-sheet data for this ticker.</p>
            </div>
        );
    }

    const max = Math.max(cash.verified ? cash.value : 0, debt.verified ? debt.value : 0, 1);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Cash vs. Debt</h3>
            <div className="space-y-2">
                <DataBar
                    value={cash.verified ? (cash.value / max) * 100 : 0}
                    label="Cash & Equivalents"
                    right={cash.verified ? `$${(cash.value / 1_000_000).toFixed(0)}M` : "no data"}
                    tone="positive"
                />
                <DataBar
                    value={debt.verified ? (debt.value / max) * 100 : 0}
                    label="Total Debt"
                    right={debt.verified ? `$${(debt.value / 1_000_000).toFixed(0)}M` : "no data"}
                    tone="negative"
                />
            </div>
        </div>
    );
}
