"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { PortfolioRiskAggregator, type PortfolioRiskReport } from "@/engine/portfolio/PortfolioRiskAggregator";

export interface PositionRow {
    id: string;
    ticker: string;
    shares: number;
    costBasis: number;
}

export interface ActionResult {
    success: boolean;
    error?: string;
}

/**
 * Fetches the current user's positions. Empty array (not an error)
 * when Supabase isn't configured or the user isn't signed in — same
 * "empty and can't-check look the same" pattern as
 * research/[ticker]/actions.ts's getResearchHistory().
 */
export async function getPositions(): Promise<PositionRow[]> {

    if (!isSupabaseConfigured()) {
        return [];
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("positions")
        .select("id, ticker, shares, cost_basis")
        .eq("user_id", user.id)
        .order("ticker", { ascending: true });

    if (error || !data) {
        return [];
    }

    return data.map(row => ({
        id: row.id,
        ticker: row.ticker,
        shares: row.shares,
        costBasis: row.cost_basis,
    }));
}

export async function addPosition(
    ticker: string,
    shares: number,
    costBasis: number
): Promise<ActionResult> {

    if (!isSupabaseConfigured()) {
        return { success: false, error: "Authentication is not configured." };
    }

    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
        return { success: false, error: "Ticker is required." };
    }

    if (!Number.isFinite(shares) || shares <= 0) {
        return { success: false, error: "Shares must be a positive number." };
    }

    if (!Number.isFinite(costBasis) || costBasis < 0) {
        return { success: false, error: "Cost basis must be zero or a positive number." };
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in to add a position." };
    }

    // upsert on (user_id, ticker) so re-adding a ticker already held
    // updates it instead of erroring on the unique constraint.
    const { error } = await supabase
        .from("positions")
        .upsert(
            {
                user_id: user.id,
                ticker: normalizedTicker,
                shares,
                cost_basis: costBasis,
            },
            { onConflict: "user_id,ticker" }
        );

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function removePosition(id: string): Promise<ActionResult> {

    if (!isSupabaseConfigured()) {
        return { success: false, error: "Authentication is not configured." };
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in to remove a position." };
    }

    // RLS also enforces this, but scoping the delete to the current
    // user here too avoids relying on RLS as the only guard.
    const { error } = await supabase
        .from("positions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export interface PortfolioRiskResult {
    success: boolean;
    error?: string;
    report?: PortfolioRiskReport;
}

/**
 * Loads the current user's positions and runs PortfolioRiskAggregator
 * over them. Returns a typed error rather than throwing when there
 * are no positions yet, or the user isn't signed in — the page
 * decides how to render each case instead of catching an exception.
 */
export async function getPortfolioRisk(): Promise<PortfolioRiskResult> {

    const positions = await getPositions();

    if (positions.length === 0) {
        return { success: false, error: "No positions yet." };
    }

    try {
        const aggregator = new PortfolioRiskAggregator();

        const report = await aggregator.build(
            positions.map(p => ({
                ticker: p.ticker,
                shares: p.shares,
                costBasis: p.costBasis,
            }))
        );

        return { success: true, report };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Portfolio risk analysis failed.",
        };
    }
}
