import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/serviceRole";
import type { TradeOrderResult } from "@/engine/trading/contracts/TradeOrder";

export async function reconcilePaperTradeOrders(
    orders: TradeOrderResult[],
    overrideUserId?: string
): Promise<void> {
    if (!isSupabaseConfigured()) {
        return;
    }

    try {
        let userId: string;
        let supabase;

        if (overrideUserId) {
            if (!isServiceRoleConfigured()) return;
            userId = overrideUserId;
            supabase = createServiceRoleClient();
        } else {
            supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            userId = user.id;
        }

        for (const order of orders) {
            if (!order.brokerOrderId) continue;

            const { data: updatedRows, error } = await supabase
                .from("paper_trade_orders")
                .update({
                    status: order.status,
                    filled_qty: order.filledQty,
                    filled_avg_price: order.filledAvgPrice,
                    filled_at: order.filledAt,
                })
                .eq("broker_order_id", order.brokerOrderId)
                .eq("user_id", userId)
                .select("id, broker_order_id, status");

            console.log(
                "reconcilePaperTradeOrders:",
                order.brokerOrderId,
                "brokerStatus=", order.status,
                "updatedRows=", updatedRows?.length ?? 0,
                "error=", error?.message ?? null
            );
        }
    } catch (err) {
        console.error(
            "reconcilePaperTradeOrders threw:",
            err instanceof Error ? err.message : err
        );
    }
}
