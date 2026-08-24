"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getMemoryStats, type MemoryStats } from "@/engine/intelligence/QuantMemoryEngine";

/**
 * Real, authenticated wrapper -- resolves the real signed-in user
 * before calling QuantMemoryEngine.getMemoryStats(), matching the
 * established pattern of every other actions.ts file this session
 * (auth resolved in the actions.ts layer, not passed in from the
 * client).
 */
export async function getQuantMemoryStats(): Promise<MemoryStats> {
    if (!isSupabaseConfigured()) {
        return { decisionsStored: 0, situationsStored: 0, noTradeDecisions: 0, linkedExecutions: 0 };
    }
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { decisionsStored: 0, situationsStored: 0, noTradeDecisions: 0, linkedExecutions: 0 };
        }
        return await getMemoryStats(user.id);
    } catch {
        return { decisionsStored: 0, situationsStored: 0, noTradeDecisions: 0, linkedExecutions: 0 };
    }
}
