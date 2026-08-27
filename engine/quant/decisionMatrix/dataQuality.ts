/**
 * Data Quality Gate v1 -- Decision Matrix, evaluated FIRST.
 *
 * Hard prerequisite, not a parallel layer: if this returns SKIP,
 * the caller must record NOT_EVALUATED for every downstream layer
 * (universe, opportunity, edge, strategy, instrument, contract,
 * risk, execution) rather than continuing to evaluate them.
 *
 * Deliberately computed from the real last_seen_at timestamp, never
 * parsed from a UI display string like "STALE 72h ago" -- UI text
 * must never become business logic.
 *
 * Thresholds are a universal v1 baseline, not yet context-aware
 * (different data types -- price vs. news vs. financials -- may
 * eventually warrant different tolerances; explicitly deferred).
 */

export type DataQualityStatus = "PASS" | "SKIP";
export type DataQualityReasonCode =
    | "DATA_FRESH"
    | "DATA_AGING"
    | "DATA_STALE"
    | "DATA_UNAVAILABLE"
    | "DATA_RATE_LIMITED"
    | "PROVIDER_QUOTA_EXHAUSTED";

export interface DataQualityResult {
    status: DataQualityStatus;
    reasonCode: DataQualityReasonCode;
    dataAgeMinutes: number | null;
    thresholdMinutes: number;
    lastSeenAt: string | null;
}

const AGING_THRESHOLD_MINUTES = 60;
const STALE_THRESHOLD_MINUTES = 180;

export function checkDataFreshness(
    lastSeenAt: string | null | undefined,
    providerFailure?: "rate_limited" | "quota_exhausted"
): DataQualityResult {
    if (providerFailure === "rate_limited") {
        return {
            status: "SKIP", reasonCode: "DATA_RATE_LIMITED",
            dataAgeMinutes: null, thresholdMinutes: STALE_THRESHOLD_MINUTES,
            lastSeenAt: lastSeenAt ?? null,
        };
    }
    if (providerFailure === "quota_exhausted") {
        return {
            status: "SKIP", reasonCode: "PROVIDER_QUOTA_EXHAUSTED",
            dataAgeMinutes: null, thresholdMinutes: STALE_THRESHOLD_MINUTES,
            lastSeenAt: lastSeenAt ?? null,
        };
    }

    if (!lastSeenAt) {
        return {
            status: "SKIP", reasonCode: "DATA_UNAVAILABLE",
            dataAgeMinutes: null, thresholdMinutes: STALE_THRESHOLD_MINUTES,
            lastSeenAt: null,
        };
    }

    const seenTime = new Date(lastSeenAt).getTime();
    if (Number.isNaN(seenTime)) {
        return {
            status: "SKIP", reasonCode: "DATA_UNAVAILABLE",
            dataAgeMinutes: null, thresholdMinutes: STALE_THRESHOLD_MINUTES,
            lastSeenAt,
        };
    }

    const ageMinutes = (Date.now() - seenTime) / (1000 * 60);

    if (ageMinutes > STALE_THRESHOLD_MINUTES) {
        return {
            status: "SKIP", reasonCode: "DATA_STALE",
            dataAgeMinutes: Math.round(ageMinutes), thresholdMinutes: STALE_THRESHOLD_MINUTES,
            lastSeenAt,
        };
    }
    if (ageMinutes > AGING_THRESHOLD_MINUTES) {
        return {
            status: "PASS", reasonCode: "DATA_AGING",
            dataAgeMinutes: Math.round(ageMinutes), thresholdMinutes: AGING_THRESHOLD_MINUTES,
            lastSeenAt,
        };
    }
    return {
        status: "PASS", reasonCode: "DATA_FRESH",
        dataAgeMinutes: Math.round(ageMinutes), thresholdMinutes: AGING_THRESHOLD_MINUTES,
        lastSeenAt,
    };
}