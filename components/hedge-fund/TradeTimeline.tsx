import type { TradeOrderResult } from "@/engine/trading/contracts/TradeOrder";

const STATUS_COLOR: Record<string, string> = {
    filled: "border-emerald-500 bg-emerald-500",
    accepted: "border-violet-500 bg-violet-500",
    rejected: "border-red-500 bg-red-500",
    canceled: "border-zinc-600 bg-zinc-600",
};

/**
 * Real visual execution history -- same real order data
 * PaperTradingPanel's "Recent orders" list already shows, just a
 * different visual treatment (vertical timeline vs. a flat list).
 * No new data fetch -- reuses the same real getOrderHistory() result
 * already loaded on the page.
 */
export default function TradeTimeline({ orders }: { orders: TradeOrderResult[] }) {
    if (orders.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-2 text-sm font-medium text-zinc-300">Trade Timeline</h3>
                <p className="text-sm text-zinc-600">No orders yet.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-3 text-sm font-medium text-zinc-300">Trade Timeline</h3>
            <div className="space-y-0">
                {orders.map((order, i) => (
                    <div key={order.brokerOrderId} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div className={`h-3 w-3 shrink-0 rounded-full border-2 ${STATUS_COLOR[order.status] ?? "border-zinc-600 bg-zinc-600"}`} />
                            {i < orders.length - 1 && <div className="w-px flex-1 bg-zinc-800" />}
                        </div>
                        <div className="pb-4 text-xs">
                            <p className="text-zinc-200">
                                <span className={order.side === "buy" ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
                                    {order.side.toUpperCase()}
                                </span>
                                {" "}{order.qty} {order.ticker}
                            </p>
                            <p className="text-zinc-500">{order.status} · {new Date(order.submittedAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
