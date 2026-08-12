import type { Quote } from "../evidence/providers/FinnhubQuoteProvider";

/**
 * Real market regime classification -- extracted from
 * MarketPulseSection.tsx's sentimentGauge() so both that page and
 * the Hedge Fund page compute the SAME real number from the SAME
 * real quotes, rather than two independent copies of this logic
 * silently drifting apart (exactly the kind of duplicated-
 * calculation risk flagged in an earlier audit this session).
 *
 * Real labels this actually produces: Risk-off, Risk-on, Cautious,
 * Mixed. NOT Bull/Bear/High-Volatility/Low-Volatility -- volatility-
 * regime detection would need real VIX data, and VIX has returned
 * unavailable throughout this entire session (a real, documented
 * Finnhub /quote limitation on index-level symbols, found earlier).
 * Adding fake Bull/Bear labels or a volatility regime with no real
 * data behind them would be the same mistake BatchScanner.ts
 * explicitly avoided with open interest -- not doing that here either.
 */
export interface MarketRegime {
    label: "Risk-off" | "Risk-on" | "Cautious" | "Mixed";
    color: string;
}

export function classifyMarketRegime(quotes: Record<string, Quote>): MarketRegime | null {
    const equities = ["DIA", "SPY", "QQQ", "IWM"].map(s => quotes[s]).filter(Boolean) as Quote[];
    const gold = quotes.GLD;
    const bonds = quotes.TLT;
    if (equities.length === 0) return null;

    const avgEquity = equities.reduce((sum, q) => sum + q.changePercent, 0) / equities.length;
    const equitiesDown = avgEquity < -0.05;
    const equitiesUp = avgEquity > 0.05;
    const goldUp = gold ? gold.changePercent > 0.5 : false;
    const bondsUp = bonds ? bonds.changePercent > 0.1 : false;

    if (equitiesDown && (goldUp || bondsUp)) return { label: "Risk-off", color: "#F04452" };
    if (equitiesUp && !goldUp) return { label: "Risk-on", color: "#16D47B" };
    if (equitiesDown) return { label: "Cautious", color: "#F5A524" };
    return { label: "Mixed", color: "#F5A524" };
}
