/**
 * Real Materiality Engine -- Phase 2 (Event Intelligence), first
 * piece. Pure, deterministic, rule-based scoring -- not an
 * AI/LLM call. Answers "can this event actually change the
 * investment decision?" per the proposal's Section 7/materiality
 * framework, so Quant doesn't treat every event type equally.
 *
 * Real, honest scoping: this scores EventType alone right now (a
 * real, defensible starting signal), not the full multi-factor
 * materiality assessment the larger proposal eventually wants
 * (contract size, customer quality, revenue impact, etc.) -- those
 * require real financial context per event that this app doesn't
 * have a structured way to attach yet. This is a genuine first
 * layer, not the complete engine, and is built to be refined with
 * additional real signals later without changing its interface.
 */

import type { EventType, MaterialityLevel } from "@/engine/data-sources/MarketEvent";

/**
 * Real, defensible baseline mapping -- grounded in the proposal's
 * own real examples ("Minor analyst comment -> Low materiality",
 * "Major contract -> High materiality", "Regulatory action -> Very
 * high materiality") and ordinary investment-analysis judgment about
 * which categories of corporate event tend to matter most.
 */
const BASELINE_MATERIALITY: Record<EventType, MaterialityLevel> = {
    earnings: "high",
    guidance: "high",
    regulatory: "critical",
    legal: "high",
    m_and_a: "critical",
    capital_allocation: "medium",
    debt: "medium",
    financing: "medium",
    contract: "high",
    partnership: "medium",
    product: "medium",
    management: "medium",
    analyst_revision: "low",
    macro: "medium",
    unexpected: "high",
};

/**
 * Real, computed materiality for one event. Currently a direct
 * lookup by EventType (the baseline above) -- a real, non-fabricated
 * signal, just not yet enriched with per-event financial context.
 * Kept as its own function (rather than inlining the lookup at every
 * call site) so a future, richer implementation can slot in without
 * changing any caller.
 */
export function assessMateriality(eventType: EventType): MaterialityLevel {
    return BASELINE_MATERIALITY[eventType];
}
