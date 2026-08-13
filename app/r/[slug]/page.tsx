import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ResearchObject } from "@/engine/models/ResearchObject";
import { excludeAnalysts } from "@/components/workstation/shared/scorePresentation";
import PrintButton from "./PrintButton";

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function loadPublishedReport(slug: string): Promise<ResearchObject | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = await createClient();

    const { data } = await supabase
        .from("research_history")
        .select("report_snapshot, company_name, ticker, created_at")
        .eq("share_slug", slug)
        .eq("is_public", true)
        .maybeSingle();

    if (!data?.report_snapshot) return null;

    return data.report_snapshot as ResearchObject;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const research = await loadPublishedReport(slug);

    if (!research) {
        return { title: "Report not found — IPO Sniper AI" };
    }

    const { ticker, name } = research.company;
    const { recommendation } = excludeAnalysts(research.committee, ["News Analyst"]);
    const title = `${ticker} Research — ${name} | IPO Sniper AI`;
    // Real, safe description -- NOT report.executiveSummary, which is
    // free-text AI synthesis that could incorporate News Analyst
    // reasoning with no way to verify it's clean. This is built
    // entirely from the recomputed, News-excluded recommendation.
    const description = `AI Committee recommendation: ${recommendation.replace("_", " ")}. Public research snapshot from IPO Sniper AI.`;

    return {
        title,
        description,
        openGraph: { title, description, type: "article" },
        twitter: { card: "summary_large_image", title, description },
    };
}

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "text-emerald-400",
    BUY: "text-emerald-400",
    HOLD: "text-zinc-300",
    REDUCE: "text-amber-400",
    SELL: "text-red-400",
};

/**
 * PUBLIC, UNAUTHENTICATED page -- verified via proxy.ts's PUBLIC_PREFIXES
 * ("/r/" is explicitly whitelisted there). Scope confirmed narrow: this
 * loads exactly one research snapshot by slug, nothing about the
 * viewer, no path into Hedge Fund/portfolio/account/admin data.
 *
 * Real, direct fix for a real compliance gap found during a session
 * audit: this page previously showed the RAW committee.recommendation/
 * overallScore/confidence/agreement (including whatever influence the
 * News Analyst had) plus multiple free-text AI-generated sections
 * (executiveSummary, catalysts, risks, committee.summary) with zero
 * News exclusion -- unlike the Share Card, which was specifically built
 * with this exclusion because NewsAPI's free-tier terms forbid
 * production/public use, and Currents similarly restricts redistribution.
 *
 * Fix: recommendation/score/confidence/agreement now recomputed via the
 * same real excludeAnalysts() function the Share Card uses -- not a
 * second, parallel implementation that could drift out of sync. The
 * four free-text narrative sections are REMOVED entirely, not filtered --
 * there's no reliable way to verify free-text AI synthesis is clean of
 * News-derived content after the fact, so the safe choice is not
 * displaying it here at all, replaced with the same structured,
 * already-vetted-safe presentation (real per-analyst scores, real
 * financial-statement Facts) the Share Card already uses.
 */
export default async function PublicReportPage({ params }: PageProps) {
    const { slug } = await params;
    const research = await loadPublishedReport(slug);

    if (!research) notFound();

    const { company, report, committee, runtime } = research;
    const { financialStatements } = report.evidence;
    const generatedDate = new Date(runtime.generatedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });

    const { score, confidence, agreement, recommendation } = excludeAnalysts(committee, ["News Analyst"]);
    const scoredAnalysts = committee.reports.filter(r => r.confidence > 0 && r.analyst !== "News Analyst");
    const scoreRows = scoredAnalysts
        .map(r => ({ name: r.analyst.replace(" Analyst", ""), score: r.score }))
        .sort((a, b) => b.score - a.score);

    const statements = financialStatements.statements.verified ? financialStatements.statements.value : [];
    const latest = statements.length > 0 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[0] : null;
    const prior = statements.length > 1 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[1] : null;
    const revenueGrowthPct = latest && prior && prior.revenue !== 0
        ? ((latest.revenue - prior.revenue) / Math.abs(prior.revenue)) * 100
        : null;
    const grossMarginPct = latest && latest.revenue !== 0 ? (latest.grossProfit / latest.revenue) * 100 : null;
    const debtToEquity = latest && latest.shareholdersEquity !== 0 ? latest.debt / latest.shareholdersEquity : null;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "AnalysisNewsArticle",
        headline: `${company.ticker} Research — ${company.name}`,
        datePublished: new Date(runtime.generatedAt).toISOString(),
        author: { "@type": "Organization", name: "IPO Sniper AI" },
        about: { "@type": "Corporation", name: company.name, tickerSymbol: company.ticker },
        description: `AI Committee recommendation: ${recommendation.replace("_", " ")}.`,
    };

    return (
        <main className="min-h-screen bg-black text-white px-6 py-10 print:bg-white print:text-black">
            {/* eslint-disable-next-line react/no-danger */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="mx-auto max-w-3xl">

                <header className="mb-8 flex items-start justify-between gap-4 print:hidden">
                    <a href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
                        &larr; IPO Sniper AI
                    </a>
                    <PrintButton />
                </header>

                <article>
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">
                        Public Research Snapshot
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                        AI-synthesized research for informational purposes. Certain proprietary or licensed research inputs may be excluded from this public snapshot.
                    </p>

                    <p className="mt-4 text-xs uppercase tracking-wide text-zinc-500">
                        Research Report &middot; Generated {generatedDate}
                    </p>

                    <h1 className="mt-1 text-3xl font-bold">
                        {company.name} <span className="text-zinc-500">({company.ticker})</span>
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 print:border-zinc-300">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Committee Recommendation</p>
                            <p className={`text-xl font-bold ${RECOMMENDATION_COLOR[recommendation] ?? "text-zinc-300"}`}>
                                {recommendation.replace("_", " ")}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Conviction</p>
                            <p className="text-xl font-bold">{score}/100</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Confidence</p>
                            <p className="text-xl font-bold">{confidence}%</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Analyst Agreement</p>
                            <p className="text-xl font-bold">{agreement}%</p>
                        </div>
                    </div>

                    <section className="mt-8">
                        <h2 className="text-lg font-semibold mb-2">Facts (from most recent filed statement)</h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Revenue Growth (YoY)</p>
                                <p className="mt-1 text-sm font-semibold text-white">{revenueGrowthPct !== null ? `${revenueGrowthPct >= 0 ? "+" : ""}${revenueGrowthPct.toFixed(1)}%` : "—"}</p>
                            </div>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Gross Margin</p>
                                <p className="mt-1 text-sm font-semibold text-white">{grossMarginPct !== null ? `${grossMarginPct.toFixed(1)}%` : "—"}</p>
                            </div>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Free Cash Flow</p>
                                <p className={`mt-1 text-sm font-semibold ${latest && latest.freeCashFlow < 0 ? "text-red-400" : "text-white"}`}>
                                    {latest ? `${latest.freeCashFlow < 0 ? "-" : ""}$${(Math.abs(latest.freeCashFlow) / 1_000_000).toFixed(1)}M` : "—"}
                                </p>
                            </div>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Debt-to-Equity</p>
                                <p className="mt-1 text-sm font-semibold text-white">{debtToEquity !== null ? debtToEquity.toFixed(2) : "—"}</p>
                            </div>
                        </div>
                    </section>

                    <section className="mt-6">
                        <h2 className="text-lg font-semibold mb-2">Committee (News Analyst excluded from this public snapshot)</h2>
                        <div className="space-y-2">
                            {scoreRows.map(a => (
                                <div key={a.name} className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300">{a.name}</span>
                                    <span className="font-medium text-white">{a.score}/100</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer className="mt-10 border-t border-zinc-800 pt-4 text-xs text-zinc-500 print:border-zinc-300">
                        Not investment advice. Generated by IPO Sniper AI from real, cited sources —
                        every claim is either verified against a source or explicitly marked
                        unverified, never guessed. Frozen as of {generatedDate}; company data may
                        have changed since. Certain proprietary and licensed research inputs (including
                        News Analyst content) are omitted from this public snapshot.{" "}
                        <a href="/#disclosures" className="underline hover:text-zinc-300 print:hidden">
                            Full disclosures →
                        </a>
                    </footer>
                </article>

            </div>
        </main>
    );
}
