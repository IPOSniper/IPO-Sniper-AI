import { fetchSecFilings } from "@/lib/secFilingsFeed";
import { scanForOpportunities } from "./OpportunityScanner";

export type OpportunitySourceCategory = "news" | "sec" | "earnings" | "price";

export interface OpportunityEvent {
    ticker: string | null;
    category: OpportunitySourceCategory;
    description: string;
    timestamp: string;
    source: string;
    sourceUrl: string | null;
}

export interface RankedOpportunity {
    ticker: string;
    score: number;
    events: OpportunityEvent[];
    scoreBreakdown: string[];
}

const CATEGORY_WEIGHT: Record<OpportunitySourceCategory, number> = {
    sec: 25,
    earnings: 20,
    news: 15,
    price: 15,
};

async function buildSecEvents(): Promise<OpportunityEvent[]> {
    try {
        const items = await fetchSecFilings(300);
        return items
            .filter(item => /^(S-1|S-1\/A|8-K|13F-HR)/.test(item.headline))
            .map(item => {
                return {
                    ticker: null,
                    category: "sec" as const,
                    description: item.headline,
                    timestamp: item.publishedAt,
                    source: "SEC EDGAR",
                    sourceUrl: item.url,
                };
            });
    } catch {
        return [];
    }
}

async function buildNewsEvents(): Promise<OpportunityEvent[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];
    try {
        const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        const items: Array<{ headline: string; source: string; url: string; datetime: number; related?: string }> = Array.isArray(data) ? data.slice(0, 15) : [];
        return items.map(item => ({
            ticker: item.related && item.related.length > 0 && item.related.length <= 6 ? item.related.toUpperCase() : null,
            category: "news" as const,
            description: item.headline,
            timestamp: new Date(item.datetime * 1000).toISOString(),
            source: item.source,
            sourceUrl: item.url,
        }));
    } catch {
        return [];
    }
}

async function buildEarningsEvents(): Promise<OpportunityEvent[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];
    try {
        const from = new Date().toISOString().slice(0, 10);
        const to = new Date();
        to.setDate(to.getDate() + 7);
        const params = new URLSearchParams({
            from,
            to: to.toISOString().slice(0, 10),
            token: apiKey,
        });
        const response = await fetch(`https://finnhub.io/api/v1/calendar/earnings?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        const items: Array<{ symbol: string; date: string; epsEstimate: number | null; hour: string }> = data.earningsCalendar ?? [];
        return items.slice(0, 30).map(item => ({
            ticker: item.symbol,
            category: "earnings" as const,
            description: `Earnings ${item.date}${item.epsEstimate !== null ? ` (EPS est. $${item.epsEstimate.toFixed(2)})` : ""}`,
            timestamp: `${item.date}T00:00:00.000Z`,
            source: "Finnhub",
            sourceUrl: null,
        }));
    } catch {
        return [];
    }
}

async function buildPriceEvents(): Promise<OpportunityEvent[]> {
    try {
        const candidates = await scanForOpportunities(15, 25);
        return candidates.map(c => ({
            ticker: c.ticker,
            category: "price" as const,
            description: `Unusual price/volume activity detected (score ${c.unusualnessScore.toFixed(0)})`,
            timestamp: new Date().toISOString(),
            source: "Alpaca",
            sourceUrl: null,
        }));
    } catch {
        return [];
    }
}

export async function buildOpportunityUniverse(): Promise<{
    rankedOpportunities: RankedOpportunity[];
    unattributedEvents: OpportunityEvent[];
}> {
    const [secEvents, newsEvents, earningsEvents, priceEvents] = await Promise.all([
        buildSecEvents(),
        buildNewsEvents(),
        buildEarningsEvents(),
        buildPriceEvents(),
    ]);

    const allEvents = [...secEvents, ...newsEvents, ...earningsEvents, ...priceEvents];

    const byTicker = new Map<string, OpportunityEvent[]>();
    const unattributedEvents: OpportunityEvent[] = [];

    for (const event of allEvents) {
        if (!event.ticker) {
            unattributedEvents.push(event);
            continue;
        }
        const existing = byTicker.get(event.ticker) ?? [];
        existing.push(event);
        byTicker.set(event.ticker, existing);
    }

    const rankedOpportunities: RankedOpportunity[] = Array.from(byTicker.entries()).map(([ticker, events]) => {
        let score = 0;
        const scoreBreakdown: string[] = [];

        const byCategory = new Map<OpportunitySourceCategory, number>();
        for (const event of events) {
            byCategory.set(event.category, (byCategory.get(event.category) ?? 0) + 1);
        }

        for (const [category, count] of byCategory.entries()) {
            const points = CATEGORY_WEIGHT[category] * count;
            score += points;
            scoreBreakdown.push(`${count} ${category} event${count > 1 ? "s" : ""} (+${points})`);
        }

        return { ticker, score, events, scoreBreakdown };
    });

    rankedOpportunities.sort((a, b) => b.score - a.score);

    return { rankedOpportunities, unattributedEvents };
}

// ─── Status-aware discovery for autonomous integration (Opportunity Engine Integration v1) ───
// Additive only -- buildOpportunityUniverse() above is untouched, existing callers
// (quant-environment route, quant-opportunity-engine route) keep current behavior exactly.

async function fetchSecEventsInner(): Promise<OpportunityEvent[]> {
    const items = await fetchSecFilings(300);
    return items
        .filter(item => /^(S-1|S-1\/A|8-K|13F-HR)/.test(item.headline))
        .map(item => ({
            ticker: null,
            category: "sec" as const,
            description: item.headline,
            timestamp: item.publishedAt,
            source: "SEC EDGAR",
            sourceUrl: item.url,
        }));
}

async function fetchNewsEventsInner(): Promise<OpportunityEvent[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) throw new Error("FINNHUB_API_KEY not configured");
    const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Finnhub news request failed: ${response.status}`);
    const data = await response.json();
    const items: Array<{ headline: string; source: string; url: string; datetime: number; related?: string }> = Array.isArray(data) ? data.slice(0, 15) : [];
    return items.map(item => ({
        ticker: item.related && item.related.length > 0 && item.related.length <= 6 ? item.related.toUpperCase() : null,
        category: "news" as const,
        description: item.headline,
        timestamp: new Date(item.datetime * 1000).toISOString(),
        source: item.source,
        sourceUrl: item.url,
    }));
}

async function fetchEarningsEventsInner(): Promise<OpportunityEvent[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) throw new Error("FINNHUB_API_KEY not configured");
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date();
    to.setDate(to.getDate() + 7);
    const params = new URLSearchParams({ from, to: to.toISOString().slice(0, 10), token: apiKey });
    const response = await fetch(`https://finnhub.io/api/v1/calendar/earnings?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Finnhub earnings request failed: ${response.status}`);
    const data = await response.json();
    const items: Array<{ symbol: string; date: string; epsEstimate: number | null; hour: string }> = data.earningsCalendar ?? [];
    return items.slice(0, 30).map(item => ({
        ticker: item.symbol,
        category: "earnings" as const,
        description: `Earnings ${item.date}${item.epsEstimate !== null ? ` (EPS est. $${item.epsEstimate.toFixed(2)})` : ""}`,
        timestamp: `${item.date}T00:00:00.000Z`,
        source: "Finnhub",
        sourceUrl: null,
    }));
}

async function fetchPriceEventsInner(): Promise<OpportunityEvent[]> {
    const candidates = await scanForOpportunities(15, 25);
    return candidates.map(c => ({
        ticker: c.ticker,
        category: "price" as const,
        description: `Unusual price/volume activity detected (score ${c.unusualnessScore.toFixed(0)})`,
        timestamp: new Date().toISOString(),
        source: "Alpaca",
        sourceUrl: null,
    }));
}

function rankEvents(allEvents: OpportunityEvent[]): { rankedOpportunities: RankedOpportunity[]; unattributedEvents: OpportunityEvent[] } {
    const byTicker = new Map<string, OpportunityEvent[]>();
    const unattributedEvents: OpportunityEvent[] = [];

    for (const event of allEvents) {
        if (!event.ticker) {
            unattributedEvents.push(event);
            continue;
        }
        const existing = byTicker.get(event.ticker) ?? [];
        existing.push(event);
        byTicker.set(event.ticker, existing);
    }

    const rankedOpportunities: RankedOpportunity[] = Array.from(byTicker.entries()).map(([ticker, events]) => {
        let score = 0;
        const scoreBreakdown: string[] = [];
        const byCategory = new Map<OpportunitySourceCategory, number>();
        for (const event of events) {
            byCategory.set(event.category, (byCategory.get(event.category) ?? 0) + 1);
        }
        for (const [category, count] of byCategory.entries()) {
            const points = CATEGORY_WEIGHT[category] * count;
            score += points;
            scoreBreakdown.push(`${count} ${category} event${count > 1 ? "s" : ""} (+${points})`);
        }
        return { ticker, score, events, scoreBreakdown };
    });

    rankedOpportunities.sort((a, b) => b.score - a.score);
    return { rankedOpportunities, unattributedEvents };
}

/**
 * Status-aware variant for autonomous discovery. Distinguishes a real provider
 * failure from an honest "no events today" empty result via Promise.allSettled,
 * instead of buildOpportunityUniverse()'s per-function swallow-to-empty-array
 * behavior. An empty result with zero failed providers is a genuine quiet
 * market, not a failure -- see failedProviders.length checks at the call site.
 */
export async function buildOpportunityUniverseWithStatus(): Promise<{
    rankedOpportunities: RankedOpportunity[];
    unattributedEvents: OpportunityEvent[];
    failedProviders: OpportunitySourceCategory[];
}> {
    const categories: OpportunitySourceCategory[] = ["sec", "news", "earnings", "price"];
    const fetchers = [fetchSecEventsInner, fetchNewsEventsInner, fetchEarningsEventsInner, fetchPriceEventsInner];

    const results = await Promise.allSettled(fetchers.map(fn => fn()));

    const failedProviders: OpportunitySourceCategory[] = [];
    const allEvents: OpportunityEvent[] = [];

    results.forEach((result, i) => {
        if (result.status === "fulfilled") {
            allEvents.push(...result.value);
        } else {
            failedProviders.push(categories[i]);
        }
    });

    const { rankedOpportunities, unattributedEvents } = rankEvents(allEvents);
    return { rankedOpportunities, unattributedEvents, failedProviders };
}
