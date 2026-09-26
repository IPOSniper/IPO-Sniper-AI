/**
 * Real, shared, reusable Tier A guard against a real, confirmed bug
 * class: parsing external text into a number and letting NaN leak
 * through undetected. Two real providers (SECForm4Provider.ts,
 * XOVRHoldingsProvider.ts) had independently written the identical
 * correct logic below - consolidated here so future code has one
 * obvious, correct pattern to reach for instead of reinventing it
 * (and risking getting it wrong, the way SECForm4Provider originally
 * did before its own real, confirmed NaN-leak bug was found and
 * fixed).
 *
 * Strips common thousands-separator commas, then requires
 * Number.isFinite() before accepting the result - any genuinely
 * unparseable value becomes null, not NaN and not a fabricated 0.
 */
export function safeNumber(rawStr: string | null | undefined): number | null {
    if (!rawStr) return null;
    const parsed = Number(rawStr.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
}