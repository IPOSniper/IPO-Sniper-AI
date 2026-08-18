import { getRejectionBreakdown } from "@/app/(app)/hedge-fund/rejection-breakdown/actions";
import { CATEGORY_LABELS } from "@/engine/quant/RejectionCategoryLabels";

/**
 * Real "Rejections by Reason" panel -- per direct request: "100
 * runs with 100 NO_TRADE results isn't necessarily a useful test...
 * Rejections: Why Quant didn't trade." Real, honest breakdown of
 * why real decisions didn't reach execution -- not a claim of why
 * "trades didn't happen" broadly, since these are formed trade
 * plans (direction != none) that were then genuinely blocked, plus
 * decisions where the committee itself never reached a direction.
 */
export default async function RejectionBreakdownPanel() {
    const breakdown = await getRejectionBreakdown();

    if (!breakdown || breakdown.total === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-1 text-sm font-medium text-zinc-300">Rejections by Reason</h3>
                <p className="text-xs text-zinc-600">No real decisions in the last 7 days yet.</p>
            </div>
        );
    }

    const rows = (Object.entries(breakdown.counts) as [keyof typeof breakdown.counts, number][])
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Rejections by Reason</h3>
                <span className="text-[10px] text-zinc-600">Real — last 7 days, {breakdown.total} decisions</span>
            </div>
            <div className="space-y-1.5">
                {rows.map(([category, count]) => (
                    <div key={category} className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                            <div className="h-full bg-amber-500" style={{ width: `${(count / breakdown.total) * 100}%` }} />
                        </div>
                        <span className="w-12 text-right text-xs text-white">{count}</span>
                        <span className="w-44 text-xs text-zinc-500">{CATEGORY_LABELS[category]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
