/**
 * Real, normalized event schema -- Phase 1 (Data Abstraction) piece
 * of the Real-Time Adaptive Intelligence architecture. This is a
 * pure type definition: the shared shape any future event source
 * (licensed news, SEC filings, earnings surprises, etc.) would
 * normalize into, so a future Event Intelligence Engine (Phase 2)
 * can consume events consistently regardless of which authorized
 * provider produced them.
 *
 * This file defines the shape only -- it does not itself ingest,
 * detect, or score any real event yet. No existing behavior changes
 * by this file existing. Building the actual ingestion/detection
 * pipeline that populates these types is real, separate, later work
 * (Phase 2), and depends on Track B's licensed provider being
 * confirmed first for anything beyond SEC/earnings data (the only
 * two source types currently confirmed-permitted for
 * internal-decision use in DataSourceRegistry.ts).
 */

import type { DataPurpose } from "./DataSourceRegistry";

export type EventType =
    | "earnings"
    | "guidance"
    | "contract"
    | "partnership"
    | "regulatory"
    | "legal"
    | "m_and_a"
    | "capital_allocation"
    | "debt"
    | "financing"
    | "product"
    | "management"
    | "analyst_revision"
    | "macro"
    | "unexpected";

export type MaterialityLevel = "low" | "medium" | "high" | "critical";

export interface MarketEvent {
    /** Real, unique ID for this specific event -- what a future audit trail (Section 20's proposal) would reference. */
    eventId: string;
    /** Which company this event concerns -- ticker only for now; real entity resolution (Section 8's proposal, mapping ticker/CIK/exchange variants to one identity) is separate, later work. */
    ticker: string;
    /** When the event actually happened/was reported, not when this app detected it. */
    occurredAt: string;
    /** When this app's own pipeline detected/ingested the event -- may lag occurredAt. */
    detectedAt: string;

    eventType: EventType;
    /** Real, honest source attribution -- which registered DataSourceRegistry entry this event came from. An event whose source isn't confirmed-permitted for "internal-decision" use should never reach Quant's decision path -- see DataSourceRegistry.isDataSourceAuthorized(). */
    sourceId: string;
    /** The specific purpose this event is being used for right now -- checked against the source's real authorization before use, not assumed. */
    intendedPurpose: DataPurpose;

    /** 0-100. How confident the pipeline is that this event is real/accurately reported -- distinct from materiality. A confirmed SEC filing should score high here regardless of how big a deal the event itself is. */
    sourceConfidence: number;
    /** 0-100. How much this event could plausibly affect the investment thesis, independent of how confident we are it's real. */
    materiality: MaterialityLevel;
    /** 0-100. How unusual/unprecedented this event is relative to what the pipeline has seen before -- see Section 14's novelty-detection proposal. Null until pattern memory (Phase 5) exists to compute it. */
    noveltyScore: number | null;

    headline: string;
    summary: string | null;

    /** Real, honest raw text should NEVER be stored here if it came from a source not licensed for internal-decision storage -- summary/headline only for restricted sources, per copyright and licensing limits already enforced elsewhere in this app. */
}
