"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface SaveResearchResult {
    success: boolean;
    error?: string;
}

/**
 * Saves a snapshot of a completed research run for the current user.
 * A Server Action (not a route handler) since it's only ever called
 * from the "Save Research" button in this same research flow, and
 * this keeps the auth/DB logic colocated with the page it serves.
 *
 * Fails honestly rather than throwing: if Supabase isn't configured
 * or the user isn't signed in (shouldn't happen given proxy.ts
 * already gates this page, but defensive here too), returns a clear
 * error the UI can show instead of a stack trace.
 */
export async function saveResearchAction(
    ticker: string,
    companyName: string,
    recommendation: string,
    conviction: number,
    confidence: number,
    agreement: number
): Promise<SaveResearchResult> {

    if (!isSupabaseConfigured()) {
        return { success: false, error: "Authentication is not configured." };
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in to save research." };
    }

    const { error } = await supabase
        .from("research_history")
        .insert({
            user_id: user.id,
            ticker,
            company_name: companyName,
            recommendation,
            conviction,
            confidence,
            committee_agreement: agreement,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export interface PublishResearchResult {
    success: boolean;
    shareUrl?: string;
    error?: string;
}

/**
 * Publishes a completed research run as a public, unauthenticated
 * page at /r/[slug] â€” for sharing a link (X, etc.) or letting search
 * / AI crawlers cite it. Freezes the full report as JSON at publish
 * time rather than the page re-running research live on every visit
 * (see the migration comment on research_history.report_snapshot for
 * why). Calling this again for the same ticker updates the existing
 * row (and its slug) rather than creating a duplicate â€” a research
 * run gets one canonical public URL, not a new one every re-publish.
 */
export async function publishResearchAction(
    research: import("@/engine/models/ResearchObject").ResearchObject
): Promise<PublishResearchResult> {

    if (!isSupabaseConfigured()) {
        return { success: false, error: "Authentication is not configured." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in to publish." };
    }

    const ticker = research.company.ticker;

    const { data: existing } = await supabase
        .from("research_history")
        .select("id, share_slug")
        .eq("user_id", user.id)
        .eq("ticker", ticker)
        .eq("is_public", true)
        .maybeSingle();

    const slug = existing?.share_slug ?? `${ticker.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`;

    const { error } = await supabase
        .from("research_history")
        .upsert({
            id: existing?.id,
            user_id: user.id,
            ticker,
            company_name: research.company.name,
            recommendation: research.committee.recommendation,
            conviction: research.committee.overallScore,
            confidence: research.committee.confidence,
            is_public: true,
            share_slug: slug,
            report_snapshot: research,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return { success: true, shareUrl: `${siteUrl}/r/${slug}` };
}

export interface ResearchHistoryEntry {
    id: string;
    ticker: string;
    companyName: string;
    recommendation: string;
    conviction: number;
    confidence: number;
    createdAt: string;
}

/**
 * Fetches the current user's recent research history. Returns an
 * empty array (not an error) when Supabase isn't configured or the
 * user isn't signed in â€” callers should treat that the same as "no
 * history yet," matching this app's honest-empty-state pattern
 * elsewhere, since an empty list and "can't check" look the same to
 * a user who has no real Supabase project yet.
 */
export async function getResearchHistory(limit = 10): Promise<ResearchHistoryEntry[]> {

    if (!isSupabaseConfigured()) {
        return [];
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("research_history")
        .select("id, ticker, company_name, recommendation, conviction, confidence, committee_agreement, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error || !data) {
        return [];
    }

    return data.map(row => ({
        id: row.id,
        ticker: row.ticker,
        companyName: row.company_name,
        recommendation: row.recommendation,
        conviction: row.conviction,
        confidence: row.confidence,
        createdAt: row.created_at,
    }));
}
