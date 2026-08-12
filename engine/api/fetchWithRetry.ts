/**
 * Real, shared retry-with-backoff wrapper for real Finnhub calls.
 * Built after a confirmed real production issue: running the Daily
 * AI Trading Session (Batch Scanner) repeatedly in quick succession
 * triggered real Finnhub 429s (rate limit exceeded) across all
 * tickers, since a full research run per ticker hits multiple real
 * Finnhub endpoints (profile, quote, financials, estimates,
 * candles) with zero shared retry logic before this existed --
 * confirmed via grep that a previously-built FinnhubClient.ts was
 * never actually imported anywhere, so no retry/backoff existed at
 * all across any of the 10 real files calling Finnhub directly.
 *
 * IMPORTANT, honest caveat: this does NOT include a cross-request
 * cache. An in-memory cache would be unreliable on Vercel's
 * serverless functions -- each invocation can be a fresh, stateless
 * instance with its own memory, so a cache "hit" in one function
 * invocation provides no guarantee of being available in the next,
 * even moments later. A real, reliable cache would need a shared
 * store (e.g. a Supabase table with a TTL check, or a real caching
 * layer like Vercel KV/Redis) -- a separate, larger piece of
 * infrastructure, not bundled into this fix. Retry/backoff is the
 * reliable part of this fix regardless of serverless statelessness,
 * since it operates within a single request's lifecycle.
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await fetch(url, init);

        if (response.status !== 429) {
            return response;
        }

        lastResponse = response;

        if (attempt < MAX_RETRIES) {
            // Real exponential backoff: 1s, 2s, 4s -- respects
            // Finnhub's real rate-limit window without hammering it
            // immediately again on the next attempt.
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            await sleep(delay);
        }
    }

    // Exhausted real retries -- return the last real 429 response
    // rather than throwing here, so callers keep their existing
    // "if (!response.ok) throw ..." pattern unchanged.
    return lastResponse!;
}
