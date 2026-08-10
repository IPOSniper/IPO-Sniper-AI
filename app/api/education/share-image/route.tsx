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
 * route) plain-language read on the day's pattern -- same logic as
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
        return "Stocks down, gold up -- a classic \"risk-off\" day: money rotating out of equities into safe havens.";
    }
    if (equitiesUp && !goldUp) {
        return "Stocks broadly higher with gold flat/down -- a \"risk-on\" day: investors more willing to hold riskier assets.";
    }
    if (equitiesDown) {
        return "Equities down today, without a clear offsetting move into safe havens like gold.";
    }
    return "A mixed day -- no clear risk-on or risk-off pattern across equities and safe havens.";
}

/**
 * Short sentiment label for the gauge row. Deliberately tied to the
 * EXACT same branching logic as describePattern() above rather than
 * a separately-invented editorial label -- "Cautious" vs "Risk-off
 * tilt" would be two different claims about the same data if they
 * weren't derived from the same computation.
 */
function sentimentLabel(rows: Array<{ symbol: string; quote: Quote | null }>): { text: string; color: string } {
    const equities = rows.filter(r => r.symbol !== "^VIX" && r.symbol !== "GLD").map(r => r.quote).filter(Boolean) as Quote[];
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

/**
 * Best/worst performer among the real instruments already fetched --
 * a genuine, derivable fact ("which of these five actually moved the
 * most today"), not an invented sector or news narrative. The
 * mockup's "root cause" / "winners today" boxes implied AI-written
 * commentary this route deliberately doesn't generate (no AI call
 * here -- see describePattern's docstring) -- this is the honest
 * substitute: real numbers, not a guessed cause.
 */
function bestAndWorst(rows: Array<{ symbol: string; label: string; quote: Quote | null }>) {
    const withData = rows.filter(r => r.quote !== null) as Array<{ symbol: string; label: string; quote: Quote }>;
    if (withData.length === 0) return { best: null, worst: null };
    const sorted = [...withData].sort((a, b) => b.quote.changePercent - a.quote.changePercent);
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
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
    const sentiment = sentimentLabel(rows);
    const { best, worst } = bestAndWorst(rows);

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
                    padding: "56px",
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

                <span style={{ fontSize: 40, fontWeight: 700, color: "#fff", marginTop: 28 }}>Market Pulse</span>
                <span style={{ fontSize: 18, color: "#8A8FA3", marginTop: 4 }}>Today&apos;s move, with real data</span>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginTop: 28,
                        padding: "20px 24px",
                        backgroundColor: "#131A26",
                        borderLeft: "4px solid #5B2DD1",
                        borderRadius: "0 12px 12px 0",
                    }}
                >
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#E7E9F0" }}>What&apos;s driving markets today?</span>
                    <span style={{ fontSize: 16, color: "#B9BECC", marginTop: 8, lineHeight: 1.5 }}>{whyLine}</span>
                </div>

                <div style={{ display: "flex", marginTop: 24, gap: 16 }}>
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
                                    borderRadius: 12,
                                    padding: "16px",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                <span style={{ fontSize: 14, color: "#8A8FA3" }}>{row.label}</span>
                                <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginTop: 6 }}>
                                    {row.quote ? row.quote.price.toFixed(2) : "—"}
                                </span>
                                <span
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        marginTop: 4,
                                        color: !row.quote ? "#52525b" : up ? "#16D47B" : "#F04452",
                                    }}
                                >
                                    {row.quote ? `${up ? "+" : ""}${row.quote.changePercent.toFixed(2)}%` : "N/A"}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: "flex", marginTop: 20, gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#0D111B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#5B85E0", textTransform: "uppercase", letterSpacing: 1 }}>Best today</span>
                        <span style={{ fontSize: 16, color: "#D3D6E0", marginTop: 6 }}>
                            {best ? `${best.label} ${best.quote.changePercent >= 0 ? "+" : ""}${best.quote.changePercent.toFixed(2)}%` : "No data"}
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#0D111B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#5B85E0", textTransform: "uppercase", letterSpacing: 1 }}>Worst today</span>
                        <span style={{ fontSize: 16, color: "#D3D6E0", marginTop: 6 }}>
                            {worst ? `${worst.label} ${worst.quote.changePercent >= 0 ? "+" : ""}${worst.quote.changePercent.toFixed(2)}%` : "No data"}
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#0D111B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#5B85E0", textTransform: "uppercase", letterSpacing: 1 }}>Data as of</span>
                        <span style={{ fontSize: 16, color: "#D3D6E0", marginTop: 6 }}>{timeStr} ET</span>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 20,
                        backgroundColor: "#0D111B",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        padding: "16px 20px",
                    }}
                >
                    <span style={{ fontSize: 16, color: "#8A8FA3" }}>Market sentiment</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: sentiment.color }}>{sentiment.text}</span>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 20,
                        backgroundColor: "#160B3D",
                        border: "1px solid rgba(91,45,209,0.5)",
                        borderRadius: 12,
                        padding: "16px 20px",
                    }}
                >
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#E7E9F0" }}>See the full AI committee inside IPO Sniper AI</span>
                    <span style={{ fontSize: 20, color: "#C3AEFF" }}>&rarr;</span>
                </div>

                <div style={{ display: "flex", marginTop: 20, color: "#5A5E70", fontSize: 14 }}>
                    Educational content only -- not financial advice. IPO Sniper AI is not a registered investment adviser.
                </div>
            </div>
        ),
        { width: 1200, height: 900 }
    );
}
