import { ImageResponse } from "next/og";
import { FinnhubQuoteProvider, type Quote } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import { fetchMarketHeadlines } from "@/engine/education/fetchMarketHeadlines";

export const runtime = "edge";

/**
 * Same 7 instruments as the full /education page (see
 * market-pulse/route.ts's docstring for why these specifically) --
 * this card used to track only 5 and skip headlines entirely, which
 * is why it felt thin. Same real data as the full page now, just a
 * different, downloadable presentation of it.
 */
const INSTRUMENTS = [
    { symbol: "DIA", label: "Dow ETF (DIA)" },
    { symbol: "SPY", label: "S&P 500 ETF (SPY)" },
    { symbol: "QQQ", label: "Nasdaq-100 ETF (QQQ)" },
    { symbol: "IWM", label: "Russell 2000 ETF (IWM)" },
    { symbol: "^VIX", label: "VIX" },
    { symbol: "GLD", label: "Gold ETF (GLD)" },
    { symbol: "TLT", label: "20+ Yr Treasury ETF (TLT)" },
];

/**
 * Deterministic (no AI call, no extra latency in an image-generation
 * route) plain-language read on the day's pattern -- same logic as
 * MarketPulseSection's describePattern, kept in sync manually since
 * this route runs on the edge runtime and can't share a client
 * component import. The shareable image should teach something
 * about *why* the numbers look the way they do, not just show them.
 */
function describePattern(rows: Array<{ symbol: string; quote: Quote | null }>): string {
    const equities = rows.filter(r => !["^VIX", "GLD", "TLT"].includes(r.symbol)).map(r => r.quote).filter(Boolean) as Quote[];
    const gold = rows.find(r => r.symbol === "GLD")?.quote ?? null;
    const bonds = rows.find(r => r.symbol === "TLT")?.quote ?? null;
    if (equities.length === 0) return "Market data unavailable today.";

    const avgEquity = equities.reduce((sum, q) => sum + q.changePercent, 0) / equities.length;
    const equitiesDown = avgEquity < -0.05;
    const equitiesUp = avgEquity > 0.05;
    const goldUp = gold ? gold.changePercent > 0.5 : false;
    const bondsUp = bonds ? bonds.changePercent > 0.1 : false;

    if (equitiesDown && (goldUp || bondsUp)) {
        return "Stocks down, gold/bonds up -- a classic \"risk-off\" day: money rotating out of equities into safe havens. That combination is what actually signals broader market caution, not just one index falling.";
    }
    if (equitiesUp && !goldUp) {
        return "Stocks broadly higher with gold/bonds flat or down -- a \"risk-on\" day: investors more willing to hold riskier assets across the board, not just one sector.";
    }
    if (equitiesDown) {
        return "Equities down today, without a clear offsetting move into safe havens like gold or bonds -- a broad pullback rather than a flight to safety.";
    }
    return "A mixed day -- no clear risk-on or risk-off pattern across equities and safe havens, meaning today's moves likely reflect stock-specific news more than a broad market shift.";
}

function sentimentLabel(rows: Array<{ symbol: string; quote: Quote | null }>): { text: string; color: string } {
    const equities = rows.filter(r => !["^VIX", "GLD", "TLT"].includes(r.symbol)).map(r => r.quote).filter(Boolean) as Quote[];
    const gold = rows.find(r => r.symbol === "GLD")?.quote ?? null;
    if (equities.length === 0) return { text: "No data", color: "#8A8FA3" };

    const avgEquity = equities.reduce((sum, q) => sum + q.changePercent, 0) / equities.length;
    const equitiesDown = avgEquity < -0.05;
    const equitiesUp = avgEquity > 0.05;
    const goldUp = gold ? gold.changePercent > 0.5 : false;

    if (equitiesDown && goldUp) return { text: "Risk-off", color: "#F04452" };
    if (equitiesUp && !goldUp) return { text: "Risk-on", color: "#16D47B" };
    if (equitiesDown) return { text: "Cautious", color: "#F5A524" };
    return { text: "Mixed", color: "#F5A524" };
}

function bestAndWorst(rows: Array<{ symbol: string; label: string; quote: Quote | null }>) {
    const withData = rows.filter(r => r.quote !== null) as Array<{ symbol: string; label: string; quote: Quote }>;
    if (withData.length === 0) return { best: null, worst: null };
    const sorted = [...withData].sort((a, b) => b.quote.changePercent - a.quote.changePercent);
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

function marketBreadth(rows: Array<{ quote: Quote | null }>): { upCount: number; total: number; upPercent: number } | null {
    const withData = rows.filter(r => r.quote !== null) as Array<{ quote: Quote }>;
    if (withData.length === 0) return null;
    const upCount = withData.filter(r => r.quote.changePercent >= 0).length;
    return { upCount, total: withData.length, upPercent: Math.round((upCount / withData.length) * 100) };
}

export async function GET() {
    const provider = new FinnhubQuoteProvider();
    const [quoteResults, headlines] = await Promise.all([
        Promise.allSettled(INSTRUMENTS.map(i => provider.getQuote(i.symbol))),
        fetchMarketHeadlines(3), // real headlines, same source as the full page -- capped to 3 to keep the card a reasonable size
    ]);

    const rows = INSTRUMENTS.map((instrument, i) => {
        const r = quoteResults[i];
        const quote: Quote | null = r.status === "fulfilled" ? r.value : null;
        return { ...instrument, quote };
    });

    const whyLine = describePattern(rows);
    const sentiment = sentimentLabel(rows);
    const { best, worst } = bestAndWorst(rows);
    const breadth = marketBreadth(rows);

    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#060A12",
                    padding: "52px",
                    fontFamily: "sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                display: "flex",
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                backgroundColor: "#160B3D",
                                border: "1px solid rgba(91,45,209,0.5)",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div style={{ display: "flex", width: 13, height: 13, borderRadius: 999, backgroundColor: "#C3AEFF" }} />
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 700, color: "#E7E9F0" }}>IPO Sniper AI</span>
                    </div>
                    <span style={{ fontSize: 18, color: "#8A8FA3" }}>{dateStr}</span>
                </div>

                <span style={{ fontSize: 38, fontWeight: 700, color: "#fff", marginTop: 24 }}>Market Pulse</span>
                <span style={{ fontSize: 17, color: "#8A8FA3", marginTop: 2 }}>Today&apos;s move, with real data</span>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginTop: 20,
                        padding: "16px 22px",
                        backgroundColor: "#131A26",
                        borderLeft: "4px solid #5B2DD1",
                        borderRadius: "0 12px 12px 0",
                    }}
                >
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#E7E9F0" }}>What&apos;s driving markets today?</span>
                    <span style={{ fontSize: 14, color: "#B9BECC", marginTop: 6, lineHeight: 1.45 }}>{whyLine}</span>
                </div>

                <div style={{ display: "flex", marginTop: 18, gap: 10 }}>
                    {rows.map(row => {
                        const up = (row.quote?.changePercent ?? 0) >= 0;
                        return (
                            <div
                                key={row.symbol}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    flex: 1,
                                    backgroundColor: "#0D111B",
                                    borderRadius: 10,
                                    padding: "12px",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                <span style={{ fontSize: 11, color: "#8A8FA3" }}>{row.label}</span>
                                <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 4 }}>
                                    {row.quote ? row.quote.price.toFixed(2) : "—"}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        marginTop: 3,
                                        color: !row.quote ? "#52525b" : up ? "#16D47B" : "#F04452",
                                    }}
                                >
                                    {row.quote ? `${up ? "+" : ""}${row.quote.changePercent.toFixed(2)}%` : "N/A"}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: "flex", marginTop: 16, gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#0D111B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#5B85E0", textTransform: "uppercase", letterSpacing: 1 }}>Trading higher</span>
                        <span style={{ fontSize: 15, color: "#D3D6E0", marginTop: 4 }}>
                            {best ? `${best.label} ${best.quote.changePercent >= 0 ? "+" : ""}${best.quote.changePercent.toFixed(2)}%` : "No data"}
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#0D111B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#5B85E0", textTransform: "uppercase", letterSpacing: 1 }}>Trading lower</span>
                        <span style={{ fontSize: 15, color: "#D3D6E0", marginTop: 4 }}>
                            {worst ? `${worst.label} ${worst.quote.changePercent >= 0 ? "+" : ""}${worst.quote.changePercent.toFixed(2)}%` : "No data"}
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#0D111B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#5B85E0", textTransform: "uppercase", letterSpacing: 1 }}>Market breadth</span>
                        <span style={{ fontSize: 15, color: "#D3D6E0", marginTop: 4 }}>
                            {breadth ? `${breadth.upCount}/${breadth.total} up (${breadth.upPercent}%)` : "No data"}
                        </span>
                    </div>
                </div>

                {/* Real headlines -- same source as the full page's "Sources" list, not a fabricated summary of "what's in the news" */}
                {headlines.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", marginTop: 16, backgroundColor: "#0D111B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#5B85E0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>In the news</span>
                        {headlines.map((h, i) => (
                            <span key={i} style={{ fontSize: 13, color: "#D3D6E0", marginTop: i === 0 ? 0 : 6, lineHeight: 1.4 }}>
                                {h.headline} <span style={{ color: "#5A5E70" }}>— {h.source}</span>
                            </span>
                        ))}
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 16,
                        backgroundColor: "#0D111B",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 10,
                        padding: "12px 18px",
                    }}
                >
                    <span style={{ fontSize: 14, color: "#8A8FA3" }}>Market sentiment · Data as of {timeStr} ET</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: sentiment.color }}>{sentiment.text}</span>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 14,
                        backgroundColor: "#160B3D",
                        border: "1px solid rgba(91,45,209,0.5)",
                        borderRadius: 10,
                        padding: "12px 18px",
                    }}
                >
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#E7E9F0" }}>See the full AI committee inside IPO Sniper AI</span>
                    <span style={{ fontSize: 18, color: "#C3AEFF" }}>&rarr;</span>
                </div>

                <div style={{ display: "flex", marginTop: 16, color: "#5A5E70", fontSize: 12 }}>
                    Educational content only -- not financial advice. IPO Sniper AI is not a registered investment adviser.
                </div>
            </div>
        ),
        { width: 1200, height: 1150 }
    );
}
