import { NextResponse } from "next/server";
import { getGainersAndLosers } from "@/engine/evidence/providers/AlpacaMoversProvider";
import { FinnhubIPOProvider } from "@/engine/evidence/providers/FinnhubIPOProvider";
import { fetchSecFilings } from "@/lib/secFilingsFeed";

export type FeedCategory = "news" | "sec" | "mover_up" | "mover_down" | "ipo_watch" | "ipo_radar" | "earnings";
export type FeedImportance = "high" | "med";

/** Shared Intelligence Bootstrap, Phase A: distinguishes a genuine empty
 * result (ok, nothing found) from a provider that actually failed, so a
 * quota exhaustion or outage is never rendered identically to "no signal."
 * Optional/undefined on existing events -- every current builder keeps
 * behaving exactly as before unless it explicitly sets this. */
export type FeedProviderStatus = "ok" | "partial" | "unavailable" | "quota_exhausted" | "error";

export interface FeedEvent {
    id: string;
    timestamp: string;
    ticker: string | null;
    category: FeedCategory;
    headline: string;
    summary: string | null;
    importance: FeedImportance;
    source: string;
    sourceUrl: string | null;
    researchUrl: string | null;
    /** Which underlying data provider produced this event (e.g. "GDELT",
     * "NewsAPI", "Finnhub") -- distinct from `source`, which is the actual
     * outlet/publication (e.g. "Reuters"). Undefined for existing builders
     * that don't yet distinguish the two. */
    provider?: string;
    /** Undefined means "ok" for backward compatibility with existing builders. */
    providerStatus?: FeedProviderStatus;
}

const MOVER_HIGH_THRESHOLD_PERCENT = 20;

async function fetchFinnhubMarketNews(): Promise<Array<{ headline: string; summary: string; source: string; url: string; datetime: number }>> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];
    try {
        const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data.slice(0, 12) : [];
    } catch {
        return [];
    }
}

async function buildNewsEvents(): Promise<FeedEvent[]> {
    try {
        const [secItems, newsItems] = await Promise.all([
            fetchSecFilings(120),
            fetchFinnhubMarketNews(),
        ]);

        const secEvents: FeedEvent[] = secItems.map(item => ({
            id: `news-${item.id}`,
            timestamp: item.publishedAt,
            ticker: null,
            category: "sec" as FeedCategory,
            headline: item.headline,
            summary: item.snippet,
            importance: "high" as FeedImportance,
            source: item.source,
            sourceUrl: item.url,
            researchUrl: null,
        }));

        const newsEvents: FeedEvent[] = newsItems.map((item, i) => ({
            id: `news-finnhub-${i}-${item.datetime}`,
            timestamp: new Date(item.datetime * 1000).toISOString(),
            ticker: null,
            category: "news" as FeedCategory,
            headline: item.headline,
            summary: item.summary || null,
            importance: "med" as FeedImportance,
            source: item.source,
            sourceUrl: item.url,
            researchUrl: null,
        }));

        return [...secEvents, ...newsEvents];
    } catch {
        return [];
    }
}

function isLikelyWarrantOrUnit(symbol: string): boolean {
    return /\.(WS|W)$/i.test(symbol) || /W$/.test(symbol) && symbol.length > 3 || symbol.includes(".");
}

async function buildMoverEvents(): Promise<FeedEvent[]> {
    try {
        const { gainers, losers } = await getGainersAndLosers(6);
        const now = new Date().toISOString();

        const toEvent = (m: { symbol: string; percentChange: number | null; price: number | null }, isGainer: boolean): FeedEvent => {
            const isWarrant = isLikelyWarrantOrUnit(m.symbol);
            return {
                id: `mover-${m.symbol}-${isGainer ? "up" : "down"}`,
                timestamp: now,
                ticker: m.symbol,
                category: isGainer ? "mover_up" : "mover_down",
                headline: `${m.symbol}${isWarrant ? " (warrant/unit)" : ""} ${isGainer ? "+" : ""}${m.percentChange?.toFixed(2) ?? "--"}%`,
                summary: m.price !== null ? `Now at $${m.price.toFixed(2)}` : null,
                importance: m.percentChange !== null && Math.abs(m.percentChange) >= MOVER_HIGH_THRESHOLD_PERCENT ? "high" : "med",
                source: "Alpaca",
                sourceUrl: null,
                researchUrl: isWarrant ? null : `/research/${m.symbol}`,
            };
        };

        return [...gainers.map(m => toEvent(m, true)), ...losers.map(m => toEvent(m, false))];
    } catch {
        return [];
    }
}

async function buildIpoWatchEvents(): Promise<FeedEvent[]> {
    try {
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const response = await fetch(`${base}/api/ipo-watch`, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        const companies: Array<{ company: string; status: string; latest: { headline: string; source: string; url: string; publishedAt: string } | null; error: string | null }> = data.companies ?? [];

        const events: FeedEvent[] = [];

        for (const c of companies) {
            if (c.latest !== null) {
                events.push({
                    id: `ipowatch-${c.company}`,
                    timestamp: c.latest.publishedAt,
                    ticker: null,
                    category: "ipo_watch" as FeedCategory,
                    headline: `${c.company}: ${c.latest.headline}`,
                    summary: null,
                    importance: c.status === "developing" ? "high" : "med" as FeedImportance,
                    source: c.latest.source,
                    sourceUrl: c.latest.url,
                    researchUrl: null,
                    provider: "NewsAPI",
                    providerStatus: "ok",
                });
            } else if (c.status === "unavailable" && c.error) {
                // Real per-company provider failure (e.g. NewsAPI quota exhaustion) --
                // surfaced as a distinct, lower-priority status event instead of being
                // silently dropped, so Live Intelligence can't misreport this as
                // "nothing happening" when the provider actually failed.
                const isQuota = /quota|too many requests|rate limit/i.test(c.error);
                events.push({
                    id: `ipowatch-unavailable-${c.company}`,
                    timestamp: new Date().toISOString(),
                    ticker: null,
                    category: "ipo_watch" as FeedCategory,
                    headline: `IPO Watch: ${c.company} unavailable (news provider ${isQuota ? "quota exhausted" : "error"})`,
                    summary: null,
                    importance: "med" as FeedImportance,
                    source: "IPO Sniper AI",
                    sourceUrl: null,
                    researchUrl: null,
                    provider: "NewsAPI",
                    providerStatus: isQuota ? "quota_exhausted" : "error",
                });
            }
            // c.status === "no_signal": genuinely checked, found nothing -- no event,
            // matching honest "nothing to report" behavior. Never silently conflated
            // with the unavailable case above.
        }

        return events;
    } catch {
        return [];
    }
}

async function buildIpoRadarEvents(): Promise<FeedEvent[]> {
    try {
        const provider = new FinnhubIPOProvider();
        const ipos = await provider.getUpcomingIPOs(5);
        const now = new Date().toISOString();

        return ipos.map(ipo => ({
            id: `iporadar-${ipo.symbol}-${ipo.date}`,
            timestamp: now,
            ticker: ipo.symbol,
            category: "ipo_radar" as FeedCategory,
            headline: `${ipo.symbol}: IPO expected ${ipo.date}`,
            summary: ipo.price || null,
            importance: "med" as FeedImportance,
            source: "Finnhub",
            sourceUrl: null,
            researchUrl: `/research/${ipo.symbol}`,
        }));
    } catch {
        return [];
    }
}

async function buildEarningsEvents(): Promise<FeedEvent[]> {
    try {
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const response = await fetch(`${base}/api/earnings/calendar?days=2`, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        const items: Array<{ symbol: string; reportDate: string; session: string; epsEstimate: number | null }> = data.items ?? [];

        const today = new Date().toISOString().slice(0, 10);

        return items.map(item => ({
            id: `earnings-${item.symbol}-${item.reportDate}`,
            timestamp: `${item.reportDate}T00:00:00.000Z`,
            ticker: item.symbol,
            category: "earnings" as FeedCategory,
            headline: `${item.symbol}: Earnings ${item.reportDate === today ? "today" : "upcoming"}`,
            summary: item.epsEstimate !== null ? `EPS est. $${item.epsEstimate.toFixed(2)}` : null,
            importance: item.reportDate === today ? "high" : "med" as FeedImportance,
            source: "Finnhub",
            sourceUrl: null,
            researchUrl: `/research/${item.symbol}`,
        }));
    } catch {
        return [];
    }
}

export async function GET() {
    const [news, movers, ipoWatch, ipoRadar, earnings] = await Promise.all([
        buildNewsEvents(),
        buildMoverEvents(),
        buildIpoWatchEvents(),
        buildIpoRadarEvents(),
        buildEarningsEvents(),
    ]);

    const events = [...news, ...movers, ...ipoWatch, ...ipoRadar, ...earnings]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 40);

    return NextResponse.json({ events, fetchedAt: new Date().toISOString() });
}
