-"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface RecentResearch {
 ticker: string;
 companyName: string;
 recommendation: string;
 conviction: number;
 createdAt: string;
}

export interface WhileYouWereAwayHome {
 lastVisitedAt: string | null;
 researchCount: number;
 recentResearch: RecentResearch[];
}

async function getAuthedUserId(): Promise<string | null> {
 if (!isSupabaseConfigured()) return null;
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 return user?.id ?? null;
}

export async function getWhileYouWereAwayHome(): Promise<WhileYouWereAwayHome> {
 const empty: WhileYouWereAwayHome = { lastVisitedAt: null, researchCount: 0, recentResearch: [] };

 const userId = await getAuthedUserId();
 if (!userId) return empty;

 try {
 const supabase = await createClient();

 const { data: profile } = await supabase.from("profiles").select("workstation_last_viewed_at").eq("id", userId).maybeSingle();
 const lastVisitedAt = profile?.workstation_last_viewed_at ?? null;

 if (!lastVisitedAt) {
 await supabase.from("profiles").update({ workstation_last_viewed_at: new Date().toISOString() }).eq("id", userId);
 return empty;
 }

 const { data, count } = await supabase
 .from("research_history")
 .select("ticker, company_name, recommendation, conviction, created_at", { count: "exact" })
 .eq("user_id", userId)
 .gt("created_at", lastVisitedAt)
 .order("created_at", { ascending: false })
 .limit(5);

 await supabase.from("profiles").update({ workstation_last_viewed_at: new Date().toISOString() }).eq("id", userId);

 return {
 lastVisitedAt,
 researchCount: count ?? 0,
 recentResearch: (data ?? []).map(row => ({
 ticker: row.ticker,
 companyName: row.company_name,
 recommendation: row.recommendation,
 conviction: row.conviction,
 createdAt: row.created_at,
 })),
 };
 } catch {
 return empty;
 }
}
