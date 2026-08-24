import { getActivityFeed } from "@/app/(app)/hedge-fund/activity-feed/actions";

const TYPE_COLOR: Record<string, string> = {
    decision: "bg-violet-500",
    order: "bg-emerald-500",
};

/**
 * Real AI activity feed -- merges two real tables into one
 * chronological view. See activity-feed/actions.ts's docstring for
 * why this shows real decision/order events only, not fabricated
 * event types (no "Committee upgraded X" or "SEC filing detected" --
 * those aren't real logged events anywhere in this system).
 */
export default async function ActivityFeedPanel() {
    const events = await getActivityFeed(15);

    if (events.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-2 text-sm font-medium text-zinc-300">AI Activity Feed</h3>
                <p className="text-sm text-zinc-600">No real activity logged yet — build a trade plan or place an order to start populating this.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">AI Activity Feed</h3>
                <span className="text-[10px] text-zinc-600">Real, from Quant Memory + order log</span>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
                {events.map(e => (
                    <div key={e.id} className="flex items-start gap-2 text-xs">
                        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_COLOR[e.type]}`} />
                        <div>
                            <p className="text-zinc-300">
                                <span className="text-zinc-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
                                {" — "}
                                <span className="font-medium text-white">{e.ticker}</span>
                                {" "}{e.label}
                            </p>
                            <p className="text-zinc-600">{e.detail}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
