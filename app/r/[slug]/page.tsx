import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ResearchObject } from "@/engine/models/ResearchObject";
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
    const title = `${ticker} Research — ${name} | IPO Sniper AI`;
    const description = research.report.executiveSummary.slice(0, 200);

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

export default async function PublicReportPage({ params }: PageProps) {
    const { slug } = await params;
    const research = await loadPublishedReport(slug);

    if (!research) notFound();

    const { company, report, committee, runtime } = research;
    const generatedDate = new Date(runtime.generatedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "AnalysisNewsArticle",
        headline: `${company.ticker} Research — ${company.name}`,
        datePublished: new Date(runtime.generatedAt).toISOString(),
        author: { "@type": "Organization", name: "IPO Sniper AI" },
        about: { "@type": "Corporation", name: company.name, tickerSymbol: company.ticker },
        description: report.executiveSummary,
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
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Research Report &middot; Generated {generatedDate}
                    </p>

                    <h1 className="mt-1 text-3xl font-bold">
                        {company.name} <span className="text-zinc-500">({company.ticker})</span>
                    </h1>

                    <div className="mt-4 flex items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 print:border-zinc-300">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Committee Recommendation</p>
                            <p className={`text-xl font-bold ${RECOMMENDATION_COLOR[committee.recommendation] ?? "text-zinc-300"}`}>
                                {committee.recommendation.replace("_", " ")}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Conviction</p>
                            <p className="text-xl font-bold">{committee.overallScore}/100</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Confidence</p>
                            <p className="text-xl font-bold">{committee.confidence}%</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Analyst Agreement</p>
                            <p className="text-xl font-bold">{committee.agreement}%</p>
                        </div>
                    </div>

                    <section className="mt-8">
                        <h2 className="text-lg font-semibold mb-2">Executive Summary</h2>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                            {report.executiveSummary}
                        </p>
                        {report.executiveSummaryIsAIGenerated && (
                            <p className="mt-2 text-xs text-zinc-500">AI-synthesized summary of the committee findings below.</p>
                        )}
                    </section>

                    {report.catalysts.length > 0 && (
                        <section className="mt-6">
                            <h2 className="text-lg font-semibold mb-2">Catalysts</h2>
                            <ul className="list-disc list-inside space-y-1 text-zinc-300">
                                {report.catalysts.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </section>
                    )}

                    {report.risks.length > 0 && (
                        <section className="mt-6">
                            <h2 className="text-lg font-semibold mb-2">Risks</h2>
                            <ul className="list-disc list-inside space-y-1 text-zinc-300">
                                {report.risks.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </section>
                    )}

                    <section className="mt-6">
                        <h2 className="text-lg font-semibold mb-2">Committee Notes</h2>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{committee.summary}</p>
                    </section>

                    <footer className="mt-10 border-t border-zinc-800 pt-4 text-xs text-zinc-500 print:border-zinc-300">
                        Not investment advice. Generated by IPO Sniper AI from real, cited sources —
                        every claim is either verified against a source or explicitly marked
                        unverified, never guessed. Frozen as of {generatedDate}; company data may
                        have changed since.{" "}
                        <a href="/#disclosures" className="underline hover:text-zinc-300 print:hidden">
                            Full disclosures →
                        </a>
                    </footer>
                </article>

            </div>
        </main>
    );
}
