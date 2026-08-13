import { getTradeTimeline, type TimelineEventType } from "@/app/(app)/hedge-fund/trade-timeline/actions";

const TYPE_STYLE: Record<TimelineEventType, { dot: string; label: string; labelColor: string }> = {
    filled: { dot: "border-emerald-500 bg-emerald-500", label: "Filled", labelColor: "text-emerald-400" },
    "broker-rejected": { dot: "border-red-500 bg-red-500", label: "Broker Rejected", labelColor: "text-red-400" },
    "risk-blocked": { dot: "border-amber-500 bg-amber-500", label: "Risk Blocked", labelColor: "text-amber-400" },
    pending: { dot: "border-zinc-600 bg-zinc-600", label: "Pending", labelColor: "text-zinc-500" },
};

/**
 * Real, enriched visual execution history -- built from
 * paper_trade_orders directly (see trade-timeline/actions.ts's
 * docstring), not just Alpaca's order history. Now an async Server
 * Component with its own real fetch, since this needs richer data
 * (risk-blocked attempts, reasoning) than TradeOrderResult[] (Alpaca's
 * order list alone) can provide -- those real risk-blocked attempts
 * never reach Alpaca at all, so they were structurally invisible in
 * the previous version.
 */
export default async function TradeTimeline() {
    const events = await getTradeTimeline(20);

    if (events.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-2 text-sm font-medium text-zinc-300">Trade Timeline</h3>
                <p className="text-sm text-zinc-600">No orders yet.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Trade Timeline</h3>
                <span className="text-[10px] text-zinc-600">Real, from the app's own order audit log — includes risk-blocked attempts Alpaca's history can't show</span>
            </div>
            <div className="space-y-0">
                {events.map((event, i) => {
                    const style = TYPE_STYLE[event.type];
                    return (
                        <div key={event.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className={`h-3 w-3 shrink-0 rounded-full border-2 ${style.dot}`} />
                                {i < events.length - 1 && <div className="w-px flex-1 bg-zinc-800" />}
                            </div>
                            <div className="pb-4 text-xs">
                                <p className="text-zinc-200">
                                    <span className={event.side === "buy" ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
                                        {event.side.toUpperCase()}
                                    </span>
                                    {" "}{event.qty} {event.ticker}
                                    {event.aiDriven && (
                                        <span className="ml-2 rounded bg-violet-950/50 px-1.5 py-0.5 text-[9px] font-medium text-violet-300">AI</span>
                                    )}
                                </p>
                                <p className={style.labelColor}>
                                    {style.label} · {new Date(event.createdAt).toLocaleString()}
                                </p>
                                {event.type === "risk-blocked" && event.reason && (
                                    <p className="mt-0.5 text-zinc-600">{event.reason}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
