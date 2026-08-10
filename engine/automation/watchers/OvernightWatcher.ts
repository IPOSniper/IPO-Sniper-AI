import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";
import { NewsAPIProvider } from "@/engine/evidence/providers/NewsAPIProvider";
import { ARKHoldingsProvider, ARK_FUNDS, type ARKFundSymbol } from "@/engine/evidence/providers/ARKHoldingsProvider";
import { finnhubFetch } from "@/lib/data/finnhub";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * Scope note: this compares three signals that already have real,
 * working providers in this codebase — new SEC filings, day-over-day
 * price move, and 24h news volume. It deliberately does NOT re-run
 * the full committee/evidence pipeline nightly for every watched
 * ticker (revenue, margins, thesis re-validation, etc.) — that would
 * mean an LLM + multi-provider run per ticker per night, which is a
 * real cost/latency/rate-limit decision, not a small addition. If you
 * want that expanded later, the natural next step is to pull
 * KnowledgeEngine facts into the `facts` column here and diff those
 * too, once you've decided you want to pay for nightly full reruns.
 */

export interface TickerAlert {
    ticker: string;
    category: "sec_filing" | "price_move" | "news_spike" | "institutional_activity";
    severity: "info" | "notable" | "material";
    headline: string;
    detail: string | null;
    sourceUrl: string | null;
}

interface PriorSnapshot {
    price: number | null;
    latest_filing_accession: string | null;
    news_count_24h: number | null;
    ark_shares: number | null;
}

const PRICE_MOVE_NOTABLE = 0.03; // 3%
const PRICE_MOVE_MATERIAL = 0.07; // 7%
const NEWS_SPIKE_MULTIPLIER = 2.5; // 24h count vs prior day's count

export class OvernightWatcher {

    private readonly sec = new SECEdgarProvider();
    private readonly news = new NewsAPIProvider();
    private readonly ark = new ARKHoldingsProvider();

    // Populated once per OvernightWatcher instance (the cron route
    // creates one instance and reuses it across the whole ticker
    // loop) — fetching all 6 ARK fund CSVs once instead of once per
    // watched ticker.
    private arkCache: Map<string, number> | null = null;

    /**
     * Checks one ticker against its most recent stored snapshot,
     * writes today's snapshot, and returns any alerts generated.
     * Never throws for a single provider failing — a missing SEC
     * key or a rate-limited news call shouldn't take down the other
     * two signals or the rest of the watchlist run.
     */
    async checkTicker(ticker: string): Promise<TickerAlert[]> {

        const supabase = createServiceRoleClient();
        const alerts: TickerAlert[] = [];

        const { data: prior } = await supabase
            .from("evidence_snapshots")
            .select("price, latest_filing_accession, news_count_24h, ark_shares")
            .eq("ticker", ticker)
            .order("snapshot_date", { ascending: false })
            .limit(1)
            .maybeSingle<PriorSnapshot>();

        const [price, filing, newsCount, arkShares] = await Promise.all([
            this.safeGetPrice(ticker),
            this.safeGetLatestFiling(ticker),
            this.safeGetNewsCount24h(ticker),
            this.safeGetArkShares(ticker),
        ]);

        if (prior) {
            alerts.push(...this.diffPrice(ticker, prior.price, price));
            alerts.push(...this.diffFiling(ticker, prior.latest_filing_accession, filing));
            alerts.push(...this.diffNewsVolume(ticker, prior.news_count_24h, newsCount));
            alerts.push(...this.diffArk(ticker, prior.ark_shares, arkShares));
        }
        // No prior snapshot (first time watching this ticker) — nothing
        // to diff against yet. This run establishes the baseline.

        const { error: snapshotError } = await supabase
            .from("evidence_snapshots")
            .upsert({
                ticker,
                snapshot_date: new Date().toISOString().slice(0, 10),
                price: price?.value ?? null,
                latest_filing_accession: filing?.accessionNumber ?? null,
                news_count_24h: newsCount,
                ark_shares: arkShares,
            }, { onConflict: "ticker,snapshot_date" });

        if (snapshotError) {
            // Still return whatever alerts we found this run — a failed
            // snapshot write shouldn't silently discard real findings.
            console.error(`evidence_snapshots upsert failed for ${ticker}:`, snapshotError.message);
        }

        if (alerts.length > 0) {
            const { error: alertsError } = await supabase.from("alerts").insert(
                alerts.map(a => ({
                    ticker: a.ticker,
                    category: a.category,
                    severity: a.severity,
                    headline: a.headline,
                    detail: a.detail,
                    source_url: a.sourceUrl,
                }))
            );
            if (alertsError) {
                console.error(`alerts insert failed for ${ticker}:`, alertsError.message);
            }
        }

        return alerts;
    }

    private diffPrice(
        ticker: string,
        priorPrice: number | null,
        current: { value: number } | null
    ): TickerAlert[] {
        if (priorPrice == null || current == null || priorPrice === 0) return [];

        const change = (current.value - priorPrice) / priorPrice;
        const magnitude = Math.abs(change);

        if (magnitude < PRICE_MOVE_NOTABLE) return [];

        const direction = change > 0 ? "up" : "down";
        const pct = (magnitude * 100).toFixed(1);

        return [{
            ticker,
            category: "price_move",
            severity: magnitude >= PRICE_MOVE_MATERIAL ? "material" : "notable",
            headline: `${ticker} moved ${direction} ${pct}% since last check`,
            detail: `Previous: $${priorPrice.toFixed(2)} -> Current: $${current.value.toFixed(2)}`,
            sourceUrl: null,
        }];
    }

    private diffFiling(
        ticker: string,
        priorAccession: string | null,
        current: { formType: string; accessionNumber: string; url: string } | null
    ): TickerAlert[] {
        if (!current) return [];
        if (current.accessionNumber === priorAccession) return [];
        // priorAccession === null just means this is the first filing
        // we've ever seen for this ticker, not necessarily "new" —
        // still worth surfacing once, at info severity.

        return [{
            ticker,
            category: "sec_filing",
            severity: ["8-K", "S-1", "S-1/A", "424B4"].includes(current.formType) ? "material" : "notable",
            headline: `${ticker} filed a new ${current.formType} with the SEC`,
            detail: priorAccession ? "New since last check." : "First filing on record for this watch.",
            sourceUrl: current.url,
        }];
    }

    private diffNewsVolume(
        ticker: string,
        priorCount: number | null,
        currentCount: number | null
    ): TickerAlert[] {
        if (priorCount == null || currentCount == null || priorCount < 3) return [];
        // Ignore low baselines (< 3 articles/day) — the ratio is noisy
        // when the denominator is tiny (1 article -> 3 articles reads
        // as a "3x spike" but isn't a meaningful signal).

        if (currentCount < priorCount * NEWS_SPIKE_MULTIPLIER) return [];

        return [{
            ticker,
            category: "news_spike",
            severity: "notable",
            headline: `News volume on ${ticker} jumped to ${currentCount} articles in 24h (from ${priorCount})`,
            detail: "Coverage spike doesn't say whether it's positive or negative — check the Market Feed for what's driving it.",
            sourceUrl: null,
        }];
    }

    private diffArk(
        ticker: string,
        priorShares: number | null,
        currentShares: number | null
    ): TickerAlert[] {
        if (priorShares == null || currentShares == null) return [];
        if (priorShares === 0 && currentShares === 0) return [];

        if (priorShares === 0 && currentShares > 0) {
            return [{
                ticker,
                category: "institutional_activity",
                severity: "notable",
                headline: `ARK Invest initiated a position in ${ticker}`,
                detail: `${currentShares.toLocaleString()} shares across ARK's ETFs as of latest holdings file.`,
                sourceUrl: "https://www.ark-funds.com/our-etfs",
            }];
        }

        if (priorShares > 0 && currentShares === 0) {
            return [{
                ticker,
                category: "institutional_activity",
                severity: "notable",
                headline: `ARK Invest exited its position in ${ticker}`,
                detail: null,
                sourceUrl: "https://www.ark-funds.com/our-etfs",
            }];
        }

        const change = Math.abs(currentShares - priorShares) / priorShares;
        if (change < 0.05) return []; // ignore small rebalancing noise

        const direction = currentShares > priorShares ? "added to" : "trimmed";
        return [{
            ticker,
            category: "institutional_activity",
            severity: change >= 0.15 ? "notable" : "info",
            headline: `ARK Invest ${direction} its ${ticker} position (${(change * 100).toFixed(0)}% share change)`,
            detail: `${priorShares.toLocaleString()} -> ${currentShares.toLocaleString()} shares.`,
            sourceUrl: "https://www.ark-funds.com/our-etfs",
        }];
    }

    private async loadArkCache(): Promise<Map<string, number>> {
        const cache = new Map<string, number>();

        const funds = Object.keys(ARK_FUNDS) as ARKFundSymbol[];
        const results = await Promise.allSettled(funds.map(f => this.ark.getHoldings(f)));

        for (const result of results) {
            if (result.status !== "fulfilled") continue;
            for (const holding of result.value) {
                const key = holding.ticker.toUpperCase();
                cache.set(key, (cache.get(key) ?? 0) + holding.shares);
            }
        }

        return cache;
    }

    private async safeGetArkShares(ticker: string): Promise<number | null> {
        try {
            if (!this.arkCache) {
                this.arkCache = await this.loadArkCache();
            }
            return this.arkCache.get(ticker.toUpperCase()) ?? 0;
        } catch {
            return null;
        }
    }

    private async safeGetPrice(ticker: string): Promise<{ value: number } | null> {
        try {
            const quote = await finnhubFetch<{ c: number }>(`/quote?symbol=${ticker}`);
            if (!quote.c) return null;
            return { value: quote.c };
        } catch {
            return null;
        }
    }

    private async safeGetLatestFiling(ticker: string) {
        try {
            const cik = await this.sec.getCIK(ticker);
            if (!cik) return null;
            const filings = await this.sec.getFilings(cik);
            const latest = filings.sort((a, b) => b.filedAt.localeCompare(a.filedAt))[0];
            if (!latest) return null;
            return {
                formType: latest.formType,
                accessionNumber: latest.accessionNumber,
                url: this.sec.buildFilingUrl(cik, latest),
            };
        } catch {
            return null;
        }
    }

    private async safeGetNewsCount24h(ticker: string): Promise<number | null> {
        try {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const articles = await this.news.search(ticker, since);
            return articles.length;
        } catch {
            return null;
        }
    }
}

/**
 * Tickers worth checking tonight: the union of everyone's watchlist
 * and everyone's held positions (a position is an implicit watch —
 * you'd want to know if something you hold changed even if you never
 * explicitly added it to a watchlist).
 */
export async function getWatchedTickers(): Promise<string[]> {
    const supabase = createServiceRoleClient();

    const [{ data: watchlist }, { data: positions }] = await Promise.all([
        supabase.from("watchlist").select("ticker"),
        supabase.from("positions").select("ticker"),
    ]);

    const tickers = new Set<string>();
    (watchlist ?? []).forEach(row => tickers.add(row.ticker));
    (positions ?? []).forEach(row => tickers.add(row.ticker));

    return Array.from(tickers);
}
