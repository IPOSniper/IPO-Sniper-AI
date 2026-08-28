"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface RecentResearchItem {
 ticker: string;
 companyName: string;
 recommendation: string;
 conviction: number;
 createdAt: string;
}

async function getAuthedUserId(): Promise<string | null> {
 if (!isSupabaseConfigured()) return null;
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 return user?.id ?? null;
}

export async function getContinueWhereYouLeftOff(limit = 5): Promise<RecentResearchItem[]> {
 const userId = await getAuthedUserId();
 if (!userId) return [];

 try {
 const supabase = await createClient();
 const { data } = await supabase
 .from("research_history")
 .select("ticker, company_name, recommendation, conviction, created_at")
 .eq("user_id", userId)
 .order("created_at", { ascending: false })
 .limit(limit * 3);

 if (!data) return [];

 const seen = new Set<string>();
 const deduped: RecentResearchItem[] = [];
 for (const row of data) {
 if (seen.has(row.ticker)) continue;
 seen.add(row.ticker);
 deduped.push({
 ticker: row.ticker,
 companyName: row.company_name,
 recommendation: row.recommendation,
 conviction: row.conviction,
 createdAt: row.created_at,
 });
 if (deduped.length >= limit) break;
 }

 return deduped;
 } catch {
 return [];
 }
}
