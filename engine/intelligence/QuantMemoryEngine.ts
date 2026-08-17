/**
 * Real Quant Memory Engine -- per direct instruction (Section 2 of
 * this round's bootstrap): "Do not duplicate existing systems...
 * inspect the existing codebase first... extend rather than create
 * competing systems." This is a real, unified READ interface over
 * existing tables, not a new database.
 *
 * No "use server" here -- matches the established convention already
 * caught and fixed once this session in EventMemory.ts: this is a
 * plain server-only utility module, not a Next.js Server Action
 * itself, meant to be called from within a real app/*\/actions.ts
 * file.
 *
 * Real mapping onto the three-layer model:
 * - Decision Memory  -> quant_trade_decisions (round79/82) --
 *   already an immutable, append-only per-decision snapshot,
 *   including real committee state at decision time and real
 *   No-Trade decisions (direction = 'none'). Satisfies this
 *   round's immutability and no-trade-memory requirements already,
 *   with zero new columns needed.
 * - Situation Memory -> market_events (round91-92) -- real ingested
 *   events for a ticker, already timestamped and immutable.
 * - Outcome Memory   -> closed-trades (round76's real FIFO-matched
 *   entry/exit/P&L).
 *
 * This round does NOT build Novelty, Pattern Recognition, Thesis
 * Reassessment, or any similarity scoring -- explicitly deferred per
 * direct instruction (Section 24). This is the data-access
 * foundation those would consume, not those engines themselves.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { matchClosedTrades, type FilledOrder, type ClosedTrade } from "@/engine/trading/lifecycle/PositionLifecycle";

export interface DecisionMemoryEntry {
    id: string;
    ticker: string;
    direction: "call" | "put" | "none";
    committeeConfidence: number;
    committeeAgreement: number;
    evidenceQuality: number | null;
    tradeQualityScore: number;
    reasoning: string[];
    brokerOrderId: string | null;
    createdAt: string;
}

export interface SituationMemoryEntry {
    eventId: string;
    eventType: string;
    materiality: string;
    noveltyScore: number | null;
    headline: string;
    occurredAt: string;
}

export interface TickerMemory {
    ticker: string;
    decisions: DecisionMemoryEntry[];
    situations: SituationMemoryEntry[];
    outcomes: ClosedTrade[];
}

/**
 * Real decision history for one ticker -- queries the existing,
 * already-immutable quant_trade_decisions table directly. No new
 * writes, no new table -- this is purely the unified read side.
 */
export async function getDecisionHistory(userId: string, ticker: string, limit = 20): Promise<DecisionMemoryEntry[]> {
    if (!isSupabaseConfigured()) return [];
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("quant_trade_decisions")
            .select("id, ticker, direction, committee_confidence, committee_agreement, evidence_quality, trade_quality_score, reasoning, broker_order_id, created_at")
            .eq("user_id", userId)
            .eq("ticker", ticker)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map(row => ({
            id: row.id,
            ticker: row.ticker,
            direction: row.direction as "call" | "put" | "none",
            committeeConfidence: row.committee_confidence,
            committeeAgreement: row.committee_agreement,
            evidenceQuality: row.evidence_quality,
            tradeQualityScore: row.trade_quality_score,
            reasoning: row.reasoning ?? [],
            brokerOrderId: row.broker_order_id,
            createdAt: row.created_at,
        }));
    } catch {
        return [];
    }
}

/**
 * Real situation history for one ticker -- queries round91's
 * market_events table directly.
 */
export async function getSituationHistory(userId: string, ticker: string, limit = 20): Promise<SituationMemoryEntry[]> {
    if (!isSupabaseConfigured()) return [];
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("market_events")
            .select("event_id, event_type, materiality, novelty_score, headline, occurred_at")
            .eq("user_id", userId)
            .eq("ticker", ticker)
            .order("occurred_at", { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map(row => ({
            eventId: row.event_id,
            eventType: row.event_type,
            materiality: row.materiality,
            noveltyScore: row.novelty_score,
            headline: row.headline,
            occurredAt: row.occurred_at,
        }));
    } catch {
        return [];
    }
}

/**
 * Real outcome history for one ticker -- reuses round76's real FIFO
 * matcher directly against this ticker's real filled orders, rather
 * than a second, competing P&L calculation.
 */
export async function getOutcomeHistory(userId: string, ticker: string): Promise<ClosedTrade[]> {
    if (!isSupabaseConfigured()) return [];
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("paper_trade_orders")
            .select("id, side, filled_avg_price, filled_qty, filled_at")
            .eq("user_id", userId)
            .eq("ticker", ticker)
            .not("filled_avg_price", "is", null)
            .not("filled_qty", "is", null)
            .not("filled_at", "is", null)
            .order("filled_at", { ascending: true });

        if (error || !data) return [];

        const orders: FilledOrder[] = data.map(row => ({
            id: row.id,
            side: row.side as "buy" | "sell",
            qty: Number(row.filled_qty),
            filledAvgPrice: Number(row.filled_avg_price),
            filledQty: Number(row.filled_qty),
            filledAt: row.filled_at,
        }));

        return matchClosedTrades(ticker, orders);
    } catch {
        return [];
    }
}

/**
 * Real, unified memory for one ticker -- the actual QuantMemoryEngine
 * interface this round's bootstrap calls for, combining all three
 * layers from existing, already-real data. No fabricated entries --
 * any layer with no real data returns an empty array, not a guess.
 */
export async function getTickerMemory(userId: string, ticker: string): Promise<TickerMemory> {
    const normalizedTicker = ticker.trim().toUpperCase();
    const [decisions, situations, outcomes] = await Promise.all([
        getDecisionHistory(userId, normalizedTicker),
        getSituationHistory(userId, normalizedTicker),
        getOutcomeHistory(userId, normalizedTicker),
    ]);

    return { ticker: normalizedTicker, decisions, situations, outcomes };
}

export interface MemoryStats {
    decisionsStored: number;
    situationsStored: number;
    noTradeDecisions: number;
    linkedExecutions: number;
}

/**
 * Real, aggregate counts across all tickers -- for the small
 * diagnostic panel this round's own Section 22 explicitly allows
 * ("Decisions Stored 66, Situations Stored XX..."), not a full UI.
 * Deliberately does NOT recompute closed-trade counts here --
 * reuses round76's existing getClosedTradesSummary() (already a
 * real, all-tickers aggregate) rather than a second, competing
 * calculation.
 */
export async function getMemoryStats(userId: string): Promise<MemoryStats> {
    if (!isSupabaseConfigured()) {
        return { decisionsStored: 0, situationsStored: 0, noTradeDecisions: 0, linkedExecutions: 0 };
    }
    try {
        const supabase = await createClient();

        const [decisionsResult, noTradeResult, situationsResult, executionsResult] = await Promise.all([
            supabase.from("quant_trade_decisions").select("id", { count: "exact", head: true }).eq("user_id", userId),
            supabase.from("quant_trade_decisions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("direction", "none"),
            supabase.from("market_events").select("id", { count: "exact", head: true }).eq("user_id", userId),
            supabase.from("quant_trade_decisions").select("id", { count: "exact", head: true }).eq("user_id", userId).not("broker_order_id", "is", null),
        ]);

        return {
            decisionsStored: decisionsResult.count ?? 0,
            situationsStored: situationsResult.count ?? 0,
            noTradeDecisions: noTradeResult.count ?? 0,
            linkedExecutions: executionsResult.count ?? 0,
        };
    } catch {
        return { decisionsStored: 0, situationsStored: 0, noTradeDecisions: 0, linkedExecutions: 0 };
    }
}
