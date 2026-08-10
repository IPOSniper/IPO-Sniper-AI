import { NextResponse } from "next/server";
import { FinnhubQuoteProvider, type Quote } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import { MarketPulseSynthesizer } from "@/engine/education/MarketPulseSynthesizer";

/**
 * DIA/SPY/QQQ/IWM = broad equity proxies (Dow, S&P 500, Nasdaq 100,
 * small-cap Russell 2000), VIX = volatility/fear gauge, GLD =
 * gold/safe-haven proxy, TLT = long bond proxy. Chosen because
 * they're liquid, widely-quoted instruments any Finnhub key can
 * fetch — not sector-specific movers (no free bulk "market movers"
 * endpoint is wired into this codebase; see the note in the route
 * below if you want to add one later).
 */
const INSTRUMENTS = ["DIA", "SPY", "QQQ", "IWM", "^VIX", "GLD", "TLT"];

export const revalidate = 900; // 15 minutes — this is an explainer, not a live tape

async function fetchHeadlines(): Promise<Array<{ headline: string; source: string; url: string }>> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
            { next: { revalidate } }
        );
        if (!response.ok) return [];

        const data: Array<{ headline: string; source: string; url: string }> = await response.json();
        // Keep only entries with a real source link — this list is
        // rendered as "Sources" on the page, so a headline without a
        // url isn't citable and shouldn't show up as if it were.
        return data
            .filter(d => d.url)
            .slice(0, 8)
            .map(d => ({ headline: d.headline, source: d.source, url: d.url }));
    } catch {
        return [];
    }
}

export async function GET() {
    if (!process.env.FINNHUB_API_KEY) {
        return NextResponse.json({
            quotes: {},
            headlines: [],
            pulse: { available: false, reason: "FINNHUB_API_KEY not configured." },
        });
    }

    const provider = new FinnhubQuoteProvider();

    const results = await Promise.allSettled(INSTRUMENTS.map(s => provider.getQuote(s)));
    const quotes: Record<string, Quote> = {};
    INSTRUMENTS.forEach((symbol, i) => {
        const r = results[i];
        if (r.status === "fulfilled") quotes[symbol.replace("^", "")] = r.value;
    });

    const headlines = await fetchHeadlines();

    if (Object.keys(quotes).length === 0) {
        return NextResponse.json({
            quotes,
            headlines,
            pulse: { available: false, reason: "No instrument quotes available — check FINNHUB_API_KEY / plan limits." },
        });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({
            quotes,
            headlines,
            pulse: { available: false, reason: "ANTHROPIC_API_KEY not configured." },
        });
    }

    try {
        const pulse = await new MarketPulseSynthesizer().synthesize({ quotes, headlines });
        return NextResponse.json({ quotes, headlines, pulse: { available: true, ...pulse } });
    } catch (err) {
        return NextResponse.json({
            quotes,
            headlines,
            pulse: { available: false, reason: err instanceof Error ? err.message : "AI synthesis failed." },
        });
    }
}
