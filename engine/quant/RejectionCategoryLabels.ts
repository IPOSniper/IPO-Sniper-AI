/**
 * Real, plain labels for RejectionCategory -- kept in a separate,
 * non-"use server" module since Next.js requires every export from
 * a Server Actions file to be async, and this is plain, synchronous
 * data.
 */

import type { RejectionCategory } from "@/app/(app)/hedge-fund/rejection-breakdown/actions";

export const CATEGORY_LABELS: Record<RejectionCategory, string> = {
    low_agreement: "Committee agreement too low",
    low_confidence: "Committee confidence too low",
    low_evidence_quality: "Evidence quality too low",
    no_committee_direction: "Committee reached no direction",
    other: "Other",
};
