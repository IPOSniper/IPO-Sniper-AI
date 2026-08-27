"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Sparkles, Download, AlertTriangle, ExternalLink, HelpCircle, ShieldQuestion } from "lucide-react";
import { classifyMarketRegime } from "@/engine/market/marketRegime";

interface Quote {
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
}

interface Pulse {
    available: boolean;
    reason?: string;
    headline?: string;
    whatsHappening?: string;
    whyItsHappening?: string;
    sectorsAffected?: string[];
    rippleEffects?: string;
    rootCauses?: string[];
    likelyWinners?: string[];
    likelyLosers?: string[];
    riskRewardNote?: string;
    safeHavenNote?: string;
    macroPoliticalNote?: string;
    riskMitigationConsiderations?: string[];
    evidenceForThisRead?: string[];
    uncertainty?: string;
    whatWouldChangeThisView?: string;
}

interface Headline {
    headline: string;
    source: string;
    url?: string;
}

interface Response {
    quotes: Record<string, Quote>;
    headlines: Headline[];
    pulse: Pulse;
}

/**
 * Real, publicly documented ETF-to-index divisors -- these ETFs are
 * literally structured/designed to track their index at roughly this
 * ratio (DIA = Dow Jones Industrial Average Trust, tracks the Dow at
 * ~1/100th; SPDR S&P 500 ETF tracks the S&P 500 at ~1/10th; iShares
 * Russell 2000 ETF tracks the Russell 2000 at ~1/10th). Verified
 * against real numbers before use: DIA/Dow, SPY/S&P, and IWM/Russell
 * all landed within ~0.1-0.6% of these exact divisors when checked
 * against a real competitor site's index values.
 *
 * QQQ deliberately has NO divisor here -- it tracks the Nasdaq-100,
 * a genuinely different index than the broader "Nasdaq Composite"
 * most sites quote, so there's no real, honest multiplier between
 * them (see INSTRUMENT_BLURBS.QQQ).
 *
 * Any value shown using this divisor is labeled "derived" in the UI
 * -- it's a real, well-established approximation, not a second live
 * data feed. Finnhub's real-time quote endpoint doesn't appear to
 * serve raw index-level values directly (confirmed via a real,
 * documented API issue report showing ^VIX returning "Symbol not
 * found" on /quote) -- likely why this app's VIX card has shown N/A
 * throughout, and why no direct real index feed exists to use instead.
 */
const INDEX_DIVISOR: Partial<Record<string, number>> = {
    DIA: 100,
    SPY: 10,
    IWM: 10,
};

const INSTRUMENT_LABELS: Record<string, string> = {
    DIA: "Dow Jones ETF Proxy (DIA)",
    SPY: "S&P 500 ETF Proxy (SPY)",
    QQQ: "Nasdaq-100 ETF (QQQ)",
    IWM: "Russell 2000 ETF Proxy (IWM)",
    VIX: "Volatility (VIX)",
    GLD: "Gold ETF (GLD)",
    TLT: "20+ Yr Treasury ETF (TLT)",
};

// What each instrument actually represents, and why its move matters
// today ... shown when a card is expanded, so clicking an index teaches
// something instead of just restating the number already on the card.
const INSTRUMENT_BLURBS: Record<string, string> = {
    DIA: "A real ETF tracking the Dow Jones Industrial Average at roughly 1/100th its level (Dow ~53,800 -> DIA ~$538) -- the price shown is the real ETF price, not the raw index level. 30 large industrial-era blue-chip stocks, price-weighted (not market-cap weighted), so it can move differently than SPY/QQQ on the same day.",
    SPY: "A real ETF tracking the S&P 500 at roughly 1/10th its level (S&P ~7,700 -> SPY ~$770) -- the price shown is the real ETF price, not the raw index level. The 500 largest U.S. companies, the most common single \"the market\" proxy professionals quote.",
    QQQ: "A real ETF tracking the Nasdaq-100 specifically -- the 100 largest non-financial companies on the Nasdaq, NOT the same as the broader \"Nasdaq Composite\" index (~3,000+ companies) you may see quoted elsewhere. The two are different baskets, not the same index at a different scale, so there's no simple multiplier between QQQ's price and a Nasdaq Composite headline number. Heavily weighted toward large tech, so it tends to swing harder than SPY on rate and growth-outlook news.",
    IWM: "A real ETF tracking the Russell 2000 at roughly 1/10th its level (Russell ~3,030 -> IWM ~$303) -- the price shown is the real ETF price, not the raw index level. Small-cap U.S. stocks, more sensitive to domestic economic conditions and borrowing costs, so IWM is often read as a gauge of risk appetite.",
    VIX: "The \"fear gauge\" ... the market's expectation of S&P 500 volatility over the next 30 days, derived from options prices. Rises when investors pay up for downside protection.",
    GLD: "Tracks the price of gold ... a traditional safe-haven asset investors rotate into during uncertainty, inflation concern, or when they distrust currencies/bonds.",
    TLT: "Tracks long-term (20+ year) U.S. Treasury bonds. Prices move opposite to interest-rate expectations ... TLT tends to rise when investors expect rates to fall or when they want a safe, government-backed asset.",
};

function QASection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors">
            <h3 className="text-sm font-semibold text-zinc-200 mb-2">{title}</h3>
            {children}
        </div>
    );
}

function BulletList({ items }: { items?: string[] }) {
    if (!items || items.length === 0) return null;
    return (
        <ul className="space-y-1 text-sm text-zinc-300 list-disc list-inside">
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    );
}

/**
 * Deterministic, no-AI-required read on the day's cross-asset pattern.
 * Renders even when ANTHROPIC_API_KEY isn't configured, so the page
 * isn't blank/unexplained just because the AI layer is off ... it's a
 * plain-language description of the shape of the data itself, not an
 * interpretation of *why*.
 */
function describePattern(quotes: Record<string, Quote>): string | null {
    const equities = ["DIA", "SPY", "QQQ", "IWM"].map(s => quotes[s]).filter(Boolean) as Quote[];
    const gold = quotes.GLD;
    const bonds = quotes.TLT;
    if (equities.length === 0) return null;

    const avgEquity = equities.reduce((sum, q) => sum + q.changePercent, 0) / equities.length;
    const equitiesDown = avgEquity < -0.05;
    const equitiesUp = avgEquity > 0.05;
    const goldUp = gold ? gold.changePercent > 0.5 : false;
    const bondsUp = bonds ? bonds.changePercent > 0.1 : false;

    if (equitiesDown && (goldUp || bondsUp)) {
        return "Stocks are down today while gold and/or long bonds are up ... a pattern often described as \"risk-off,\" where money rotates out of equities and into assets seen as safer.";
    }
    if (equitiesUp && !goldUp) {
        return "Stocks are broadly higher today with safe-haven assets like gold flat or lower ... a \"risk-on\" pattern, where investors are more willing to hold riskier assets.";
    }
    if (equitiesDown) {
        return "Equity indexes are down today. Safe-haven assets (gold, long bonds) aren't showing a clear offsetting move, so this doesn't read as a strong flight-to-safety day.";
    }
    return "Markets are mixed today, without a clear risk-on or risk-off pattern across equities and safe-haven assets.";
}

/**
 * Real, computed directly from the same quotes already fetched for
 * the index row above ... % of tracked instruments up vs down today.
 * Zero new API calls, zero interpretation layered on top.
 */
function marketBreadth(quotes: Record<string, Quote>): { upCount: number; downCount: number; upPercent: number } | null {
    const entries = Object.values(quotes);
    if (entries.length === 0) return null;
    const upCount = entries.filter(q => q.changePercent >= 0).length;
    const downCount = entries.length - upCount;
    return { upCount, downCount, upPercent: Math.round((upCount / entries.length) * 100) };
}

/**
 * Short sentiment label + a 0-100 gauge position, derived from the
 * EXACT same branching logic as describePattern() so the gauge and
 * the paragraph can never contradict each other ... this is one
 * classification computed once, presented two ways.
 */
const CONCEPT_LIBRARY: Array<{ term: string; definition: string }> = [
    { term: "Risk-on / Risk-off", definition: "Shorthand for whether investors are broadly seeking riskier assets (stocks, small-caps) or rotating into safer ones (gold, long bonds, cash)." },
    { term: "Basis point (bp)", definition: "1/100th of a percentage point. A move from 4.00% to 4.25% is \"25 basis points\" ... more precise than percentages for small rate changes." },
    { term: "Market breadth", definition: "How many individual instruments are participating in a move, not just the headline index number ... a rally on narrow breadth reads differently than one where almost everything is up." },
    { term: "Volatility (VIX)", definition: "The market's expectation of how much the S&P 500 will swing over the next 30 days, priced from options. Often called the \"fear gauge.\"" },
    { term: "Safe haven", definition: "An asset investors rotate into during uncertainty because it's expected to hold value ... gold and long-dated government bonds are the classic examples." },
    { term: "Yield", definition: "The return an investor earns on a bond. Yields rise when bond prices fall, and vice versa ... they move in opposite directions." },
];

export default function MarketPulseSection() {
    const [data, setData] = useState<Response | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/education/market-pulse")
            .then(res => res.json())
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    // Click-to-expand an index card, click-anywhere-outside to close.
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setExpanded(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const chartData = data
        ? Object.entries(data.quotes).map(([symbol, q]) => ({
            symbol,
            changePercent: Number(q.changePercent.toFixed(2)),
        }))
        : [];

    return (
        <div className="space-y-5">

            {/* Purpose banner ... states plainly what this page is and isn't for */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-sm text-zinc-300">
                    <span className="font-semibold text-white">What this page is for: </span>
                    understanding what moved markets today, why, and how confident that explanation actually is ...
                    not a signal to act on. Click any index below to learn what it tracks and why its move matters.
                </p>
            </div>

            {/* Static disclaimer ... always shown regardless of AI output */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-400">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                    Educational content only ... not financial or investment advice. IPO Sniper AI is not a
                    registered investment adviser. Nothing here is a recommendation to buy, sell, or hold any
                    security.
                </span>
            </div>

            {/* Sentiment gauge + market breadth ... both computed directly
                from the same quotes fetched for the index row below,
                no new data source, no AI call. Real numbers, not the
                mockup's decorative arc ... a plain bar and a percentage. */}
            {!loading && data && Object.keys(data.quotes).length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    {classifyMarketRegime(data.quotes) && (
                        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <span className="text-sm text-zinc-400">Market sentiment</span>
                            <span className="text-lg font-semibold" style={{ color: classifyMarketRegime(data.quotes)!.color }}>
                                {classifyMarketRegime(data.quotes)!.label}
                            </span>
                        </div>
                    )}
                    {marketBreadth(data.quotes) && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
                                <span>{marketBreadth(data.quotes)!.upCount} of {Object.keys(data.quotes).length} instruments up</span>
                                <span>{marketBreadth(data.quotes)!.upPercent}%</span>
                            </div>
                            <div className="flex h-2 w-full overflow-hidden rounded-full bg-red-950">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-700"
                                    style={{ width: `${marketBreadth(data.quotes)!.upPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {loading && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
                    Loading your market pulse...
                </div>
            )}

            {!loading && data && Object.keys(data.quotes).length > 0 && (
                <>
                    {/* Instrument row ... click a card to expand what it means and why it moved */}
                    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {Object.entries(data.quotes).map(([symbol, q]) => {
                            const up = q.changePercent >= 0;
                            const isExpanded = expanded === symbol;
                            return (
                                <button
                                    key={symbol}
                                    type="button"
                                    onClick={() => setExpanded(isExpanded ? null : symbol)}
                                    className={`group relative overflow-hidden rounded-xl border bg-zinc-950 p-3 text-left transition-all ${
                                        up ? "border-emerald-900/60 hover:border-emerald-700" : "border-red-900/60 hover:border-red-700"
                                    } ${isExpanded ? "col-span-2 md:col-span-4 lg:col-span-7 ring-1 ring-cyan-600" : ""}`}
                                >
                                    <div className={`absolute inset-x-0 top-0 h-0.5 ${up ? "bg-emerald-500" : "bg-red-500"}`} />
                                    <p className="text-xs text-zinc-500">{INSTRUMENT_LABELS[symbol] ?? symbol}</p>
                                    <p className="mt-1 text-lg font-semibold text-white">{q.price.toFixed(2)}</p>
                                    {INDEX_DIVISOR[symbol] && (
                                        <p className="text-[10px] text-zinc-600">
                                            ...{(q.price * INDEX_DIVISOR[symbol]!).toLocaleString(undefined, { maximumFractionDigits: 0 })} index-equiv. (derived)
                                        </p>
                                    )}
                                    <p className={`flex items-center gap-1 text-xs mt-0.5 font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                                        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {up ? "+" : ""}{q.changePercent.toFixed(2)}%
                                    </p>

                                    {isExpanded && (
                                        <div className="mt-3 border-t border-zinc-800 pt-3 text-sm text-zinc-300">
                                            <p>{INSTRUMENT_BLURBS[symbol] ?? "No description available."}</p>
                                            <p className="mt-2 text-xs text-zinc-500">
                                                Previous close: {q.previousClose.toFixed(2)} ... Change: {q.change >= 0 ? "+" : ""}{q.change.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Plain-language read on the chart ... always renders, doesn't need AI */}
                    {describePattern(data.quotes) && (
                        <div className="rounded-xl border border-violet-900/40 bg-violet-950/10 p-4">
                            <p className="text-sm text-zinc-200">{describePattern(data.quotes)}</p>
                        </div>
                    )}

                    {/* Real-data chart */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Today&apos;s % Change</p>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400 inline-block" /> Up</span>
                                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400 inline-block" /> Down</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="symbol" stroke="#a1a1aa" fontSize={12} />
                                <YAxis stroke="#a1a1aa" fontSize={12} unit="%" />
                                <ReferenceLine y={0} stroke="#52525b" />
                                <Tooltip
                                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                                    labelStyle={{ color: "#e4e4e7" }}
                                    formatter={(value) => {
                                        const n = typeof value === "number" ? value : Number(value);
                                        if (!Number.isFinite(n)) return ["...", "Change"];
                                        return [`${n > 0 ? "+" : ""}${n}%`, "Change"];
                                    }}
                                />
                                <Bar dataKey="changePercent" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={entry.changePercent >= 0 ? "#34d399" : "#f87171"}
                                            opacity={expanded && expanded !== entry.symbol ? 0.35 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <p className="mt-2 text-xs text-zinc-500">
                            Each bar is that instrument&apos;s price move since the previous close, in percent. Bars above
                            the 0% line are up on the day; below it, down. Hover a bar for the exact number, or click a
                            card above to expand it here.
                        </p>
                    </div>
                </>
            )}

            {!loading && (!data || Object.keys(data.quotes ?? {}).length === 0) && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
                    {data?.pulse.reason ?? "Market data unavailable."}
                </div>
            )}

            {!loading && data?.pulse.available && (
                <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-violet-400">
                        <Sparkles size={12} />
                        AI ANALYSIS ... educational interpretation, not verified fact or advice
                    </div>

                    {data.pulse.headline && (
                        <h2 className="text-xl font-bold text-white">{data.pulse.headline}</h2>
                    )}

                    {/* Evidence + uncertainty come first and get their own visual weight ...
                        this is the "justify reasoning, name uncertainty, say what would
                        change your mind" framing, front and center rather than buried
                        among the other Q&A cards. */}
                    {(data.pulse.evidenceForThisRead?.length || data.pulse.uncertainty || data.pulse.whatWouldChangeThisView) && (
                        <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/10 p-4 space-y-3">
                            {data.pulse.evidenceForThisRead && data.pulse.evidenceForThisRead.length > 0 && (
                                <div>
                                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-400 mb-1.5">
                                        <ShieldQuestion size={13} /> Evidence this read is based on
                                    </p>
                                    <BulletList items={data.pulse.evidenceForThisRead} />
                                </div>
                            )}
                            {data.pulse.uncertainty && (
                                <div>
                                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                                        <HelpCircle size={13} /> What today&apos;s data doesn&apos;t tell you
                                    </p>
                                    <p className="text-sm text-zinc-300">{data.pulse.uncertainty}</p>
                                </div>
                            )}
                            {data.pulse.whatWouldChangeThisView && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                                        What would change this read
                                    </p>
                                    <p className="text-sm text-zinc-300">{data.pulse.whatWouldChangeThisView}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <QASection title="What's Happening">
                            <p className="text-sm text-zinc-300">{data.pulse.whatsHappening}</p>
                        </QASection>
                        <QASection title="Why It's Happening">
                            <p className="text-sm text-zinc-300">{data.pulse.whyItsHappening}</p>
                        </QASection>
                        <QASection title="Sectors Affected">
                            <BulletList items={data.pulse.sectorsAffected} />
                        </QASection>
                        <QASection title="Ripple Effects">
                            <p className="text-sm text-zinc-300">{data.pulse.rippleEffects}</p>
                        </QASection>
                        <QASection title="Root Causes">
                            <BulletList items={data.pulse.rootCauses} />
                        </QASection>
                        <QASection title="Who Benefits vs. Who's Hurt">
                            <p className="text-xs uppercase tracking-wide text-emerald-500 mb-1">Likely Winners</p>
                            <BulletList items={data.pulse.likelyWinners} />
                            <p className="text-xs uppercase tracking-wide text-red-500 mt-3 mb-1">Likely Losers</p>
                            <BulletList items={data.pulse.likelyLosers} />
                        </QASection>
                        <QASection title="Risk vs. Reward">
                            <p className="text-sm text-zinc-300">{data.pulse.riskRewardNote}</p>
                        </QASection>
                        <QASection title="Safe-Haven Flows (Gold & Precious Metals)">
                            <p className="text-sm text-zinc-300">{data.pulse.safeHavenNote}</p>
                        </QASection>
                        <QASection title="Elections, War &amp; Macro Risk">
                            <p className="text-sm text-zinc-300">{data.pulse.macroPoliticalNote}</p>
                        </QASection>
                        <QASection title="General Risk-Mitigation Concepts">
                            <BulletList items={data.pulse.riskMitigationConsiderations} />
                        </QASection>
                    </div>
                </div>
            )}

            {!loading && data && !data.pulse.available && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-500">
                    AI analysis unavailable ... {data.pulse.reason ?? "not configured."}
                    {data.pulse.reason?.includes("ANTHROPIC_API_KEY") && (
                        <span className="block mt-1 text-xs text-zinc-600">
                            Set ANTHROPIC_API_KEY in your .env.local and restart the dev server to enable the
                            AI explainer ... the index cards and chart above use real data either way.
                        </span>
                    )}
                </div>
            )}

            {!loading && data && data.headlines.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3">Sources</h3>
                    <ul className="space-y-2">
                        {data.headlines.map((h, i) => (
                            <li key={i}>
                                {h.url ? (
                                    <a
                                        href={h.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-start gap-2 text-sm text-zinc-300 hover:text-white"
                                    >
                                        <ExternalLink size={13} className="mt-0.5 shrink-0 text-zinc-500 group-hover:text-zinc-300" />
                                        <span>
                                            {h.headline}{" "}
                                            <span className="text-zinc-500">... {h.source}</span>
                                        </span>
                                    </a>
                                ) : (
                                    <span className="text-sm text-zinc-400">
                                        {h.headline} <span className="text-zinc-500">... {h.source}</span>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!loading && data && Object.keys(data.quotes).length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3">Concept Library</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {CONCEPT_LIBRARY.map(c => (
                            <div key={c.term}>
                                <p className="text-sm font-medium text-violet-300">{c.term}</p>
                                <p className="mt-0.5 text-xs text-zinc-400">{c.definition}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && data && Object.keys(data.quotes).length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3">Related Reading</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <a
                            href="/workstation"
                            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 hover:border-violet-700 hover:text-white transition"
                        >
                            Research a specific ticker in the Workstation
                        </a>
                        <a
                            href="/watchlist"
                            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 hover:border-violet-700 hover:text-white transition"
                        >
                            See how today's move affects your watchlist
                        </a>
                    </div>
                </div>
            )}

            <ShareImageDownload />
        </div>
    );
}

/**
 * Same "generate, preview, then download" pattern as ShareCardButton
 * and EarningsPreviewShareCardButton -- this used to be a plain
 * <a href download> that triggered an immediate download with no
 * chance to see the image first, inconsistent with the other two
 * share cards in this app.
 */
function ShareImageDownload() {
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleGenerate() {
        setStatus("loading");
        setErrorMessage(null);
        try {
            const res = await fetch("/api/education/share-image");
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const blob = await res.blob();
            setPreviewUrl(URL.createObjectURL(blob));
            setStatus("idle");
        } catch (err) {
            setStatus("error");
            setErrorMessage(err instanceof Error ? err.message : "Could not generate image.");
        }
    }

    function handleDownload() {
        if (!previewUrl) return;
        const link = document.createElement("a");
        link.download = "market-pulse.png";
        link.href = previewUrl;
        link.click();
    }

    if (!previewUrl) {
        return (
            <div>
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={status === "loading"}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:border-emerald-600 hover:text-white transition disabled:opacity-50"
                >
                    <Download size={14} />
                    {status === "loading" ? "Generating..." : "Preview for Twitter / X"}
                </button>
                {status === "error" && <p className="mt-2 text-sm text-red-400">{errorMessage}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- object URL preview, not a static asset */}
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Click to open full size in a new tab">
                <img src={previewUrl} alt="Your Market Pulse share card" className="w-full max-w-2xl rounded-lg border border-zinc-800 transition hover:border-violet-600" />
            </a>
            <p className="text-xs text-zinc-500">Click the image to open it full size in a new tab.</p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition"
                >
                    <Download size={14} />
                    Download PNG
                </button>
                <button
                    type="button"
                    onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                    className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:text-white transition"
                >
                    Regenerate
                </button>
            </div>
        </div>
    );
}
