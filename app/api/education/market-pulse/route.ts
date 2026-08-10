import { NextResponse } from "next/server";
import { FinnhubQuoteProvider, type Quote } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import { MarketPulseSynthesizer } from "@/engine/education/MarketPulseSynthesizer";
import { fetchMarketHeadlines } from "@/engine/education/fetchMarketHeadlines";

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

    const headlines = await fetchMarketHeadlines();

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
