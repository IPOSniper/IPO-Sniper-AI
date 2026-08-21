import { NextResponse } from "next/server";
import { getGainersAndLosers } from "@/engine/evidence/providers/AlpacaMoversProvider";
import { FinnhubIPOProvider } from "@/engine/evidence/providers/FinnhubIPOProvider";

export type FeedCategory = "news" | "sec" | "mover_up" | "mover_down" | "ipo_watch" | "ipo_radar" | "earnings";
export type FeedImportance = "high" | "med";

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
}

const MOVER_HIGH_THRESHOLD_PERCENT = 20;

async function buildNewsEvents(): Promise<FeedEvent[]> {
    try {
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const response = await fetch(`${base}/api/market-news`, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        const items: Array<{ id: string; category: string; headline: string; snippet: string | null; source: string; url: string; publishedAt: string }> = data.items ?? [];

        return items.map(item => ({
            id: `news-${item.id}`,
            timestamp: item.publishedAt,
            ticker: null,
            category: (item.category === "sec" ? "sec" : "news") as FeedCategory,
            headline: item.headline,
            summary: item.snippet,
            importance: item.category === "sec" ? "high" : "med" as FeedImportance,
            source: item.source,
            sourceUrl: item.url,
            researchUrl: null,
        }));
    } catch {
        return [];
    }
}

async function buildMoverEvents(): Promise<FeedEvent[]> {
    try {
        const { gainers, losers } = await getGainersAndLosers(6);
        const now = new Date().toISOString();

        const toEvent = (m: { symbol: string; percentChange: number | null; price: number | null }, isGainer: boolean): FeedEvent => ({
            id: `mover-${m.symbol}-${isGainer ? "up" : "down"}`,
            timestamp: now,
            ticker: m.symbol,
            category: isGainer ? "mover_up" : "mover_down",
            headline: `${m.symbol} ${isGainer ? "+" : ""}${m.percentChange?.toFixed(2) ?? "--"}%`,
            summary: m.price !== null ? `Now at $${m.price.toFixed(2)}` : null,
            importance: m.percentChange !== null && Math.abs(m.percentChange) >= MOVER_HIGH_THRESHOLD_PERCENT ? "high" : "med",
            source: "Alpaca",
            sourceUrl: null,
            researchUrl: `/research/${m.symbol}`,
        });

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
        const companies: Array<{ company: string; status: string; latest: { headline: string; source: string; url: string; publishedAt: string } | null }> = data.companies ?? [];

        return companies
            .filter(c => c.latest !== null)
            .map(c => ({
                id: `ipowatch-${c.company}`,
                timestamp: c.latest!.publishedAt,
                ticker: null,
                category: "ipo_watch" as FeedCategory,
                headline: `${c.company}: ${c.latest!.headline}`,
                summary: null,
                importance: c.status === "developing" ? "high" : "med" as FeedImportance,
                source: c.latest!.source,
                sourceUrl: c.latest!.url,
                researchUrl: null,
            }));
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
