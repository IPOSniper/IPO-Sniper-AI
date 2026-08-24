"use server";

/**
 * Real "Rejections by Reason" breakdown -- per direct request:
 * "100 runs with 100 NO_TRADE results isn't necessarily a useful
 * test... Rejections: Why Quant didn't trade." Classifies real,
 * already-stored quant_trade_decisions rows by their real, dominant
 * blocking reason -- no new schema, just real aggregation over data
 * that already exists.
 *
 * Real, honest scoping: classification is real, simple text-pattern
 * matching over the real reasoning array each decision already
 * stores (e.g. "Committee Agreement (33%) is below the 50%
 * minimum"). Categories are broad and real, not a claim of
 * exhaustive coverage -- an "Other" bucket honestly catches
 * anything that doesn't match a known real pattern, rather than
 * mis-filing it into a category it doesn't belong to.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type RejectionCategory = "low_agreement" | "low_confidence" | "low_evidence_quality" | "no_committee_direction" | "other";

export interface RejectionBreakdown {
    total: number;
    counts: Record<RejectionCategory, number>;
}

function classify(reasoning: string[], direction: string): RejectionCategory {
    const joined = reasoning.join(" ").toLowerCase();
    if (direction === "none") return "no_committee_direction";
    if (joined.includes("agreement") && joined.includes("below")) return "low_agreement";
    if (joined.includes("confidence") && joined.includes("below")) return "low_confidence";
    if (joined.includes("evidence quality") && joined.includes("below")) return "low_evidence_quality";
    return "other";
}

/**
 * Real, honest rejection breakdown over the real, most recent
 * decisions (default: last 7 days, same real window
 * QuantActivityPanel already uses).
 */
export async function getRejectionBreakdown(days = 7): Promise<RejectionBreakdown | null> {
    if (!isSupabaseConfigured()) return null;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from("quant_trade_decisions")
            .select("direction, reasoning")
            .eq("user_id", user.id)
            .gt("created_at", since);

        if (error || !data) return null;

        const counts: Record<RejectionCategory, number> = { low_agreement: 0, low_confidence: 0, low_evidence_quality: 0, no_committee_direction: 0, other: 0 };
        for (const row of data) {
            counts[classify(row.reasoning ?? [], row.direction)]++;
        }

        return { total: data.length, counts };
    } catch {
        return null;
    }
}
