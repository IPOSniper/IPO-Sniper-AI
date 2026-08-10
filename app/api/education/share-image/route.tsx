import { ImageResponse } from "next/og";
import { FinnhubQuoteProvider, type Quote } from "@/engine/evidence/providers/FinnhubQuoteProvider";

export const runtime = "edge";

const INSTRUMENTS = [
    { symbol: "DIA", label: "Dow Jones" },
    { symbol: "SPY", label: "S&P 500" },
    { symbol: "QQQ", label: "Nasdaq 100" },
    { symbol: "^VIX", label: "VIX" },
    { symbol: "GLD", label: "Gold" },
];

/**
 * Deterministic (no AI call, no extra latency in an image-generation
 * route) plain-language read on the day's pattern — same logic as
 * MarketPulseSection's describePattern, kept in sync manually since
 * this route runs on the edge runtime and can't share a client
 * component import. The shareable image should teach something
 * about *why* the numbers look the way they do, not just show them.
 */
function describePattern(rows: Array<{ symbol: string; quote: Quote | null }>): string {
    const equities = rows.filter(r => r.symbol !== "^VIX" && r.symbol !== "GLD").map(r => r.quote).filter(Boolean) as Quote[];
    const gold = rows.find(r => r.symbol === "GLD")?.quote ?? null;
    if (equities.length === 0) return "Market data unavailable today.";

    const avgEquity = equities.reduce((sum, q) => sum + q.changePercent, 0) / equities.length;
    const equitiesDown = avgEquity < -0.05;
    const equitiesUp = avgEquity > 0.05;
    const goldUp = gold ? gold.changePercent > 0.5 : false;

    if (equitiesDown && goldUp) {
        return "Stocks down, gold up — a classic \"risk-off\" day: money rotating out of equities into safe havens.";
    }
    if (equitiesUp && !goldUp) {
        return "Stocks broadly higher with gold flat/down — a \"risk-on\" day: investors more willing to hold riskier assets.";
    }
    if (equitiesDown) {
        return "Equities down today, without a clear offsetting move into safe havens like gold.";
    }
    return "A mixed day — no clear risk-on or risk-off pattern across equities and safe havens.";
}

export async function GET() {
    const provider = new FinnhubQuoteProvider();
    const results = await Promise.allSettled(INSTRUMENTS.map(i => provider.getQuote(i.symbol)));

    const rows = INSTRUMENTS.map((instrument, i) => {
        const r = results[i];
        const quote: Quote | null = r.status === "fulfilled" ? r.value : null;
        return { ...instrument, quote };
    });

    const whyLine = describePattern(rows);

    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#09090b",
                    padding: "60px",
                    fontFamily: "sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 40, fontWeight: 700, color: "#fff" }}>Market Pulse</span>
                    <span style={{ fontSize: 22, color: "#71717a" }}>IPO Sniper AI</span>
                </div>
                <span style={{ fontSize: 20, color: "#a1a1aa", marginTop: 4 }}>{dateStr}</span>

                <div style={{ display: "flex", marginTop: 50, gap: 24 }}>
                    {rows.map(row => {
                        const up = (row.quote?.changePercent ?? 0) >= 0;
                        return (
                            <div
                                key={row.symbol}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    flex: 1,
                                    backgroundColor: "#18181b",
                                    borderRadius: 16,
                                    padding: "24px",
                                    border: "1px solid #27272a",
                                }}
                            >
                                <span style={{ fontSize: 18, color: "#71717a" }}>{row.label}</span>
                                <span style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginTop: 8 }}>
                                    {row.quote ? row.quote.price.toFixed(2) : "—"}
                                </span>
                                <span
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 600,
                                        marginTop: 4,
                                        color: !row.quote ? "#52525b" : up ? "#34d399" : "#f87171",
                                    }}
                                >
                                    {row.quote ? `${up ? "+" : ""}${row.quote.changePercent.toFixed(2)}%` : "N/A"}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div
                    style={{
                        display: "flex",
                        marginTop: 36,
                        padding: "20px 24px",
                        backgroundColor: "#1e1b3a",
                        border: "1px solid #4c1d95",
                        borderRadius: 12,
                        fontSize: 20,
                        color: "#e4e4e7",
                    }}
                >
                    {whyLine}
                </div>

                <div style={{ display: "flex", marginTop: 24, color: "#52525b", fontSize: 16 }}>
                    Educational content only — not financial advice.
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
