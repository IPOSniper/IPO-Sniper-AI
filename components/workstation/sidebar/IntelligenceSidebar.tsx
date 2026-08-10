import React from "react";

import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import type { EvidenceItem } from "@/engine/evidence/types";
import MarketContext from "../panels/MarketContext/MarketContext";
import ResearchHistory from "../panels/ResearchHistory/ResearchHistory";

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "text-emerald-400",
    BUY: "text-emerald-400",
    HOLD: "text-zinc-300",
    REDUCE: "text-amber-400",
    SELL: "text-red-400",
};

export default function IntelligenceSidebar({
    research,
}: WorkstationPanelProps) {

    const { committee, report } = research;

    const evidenceCategories = ["financial", "management", "ipo", "market", "industry", "news", "sec", "quote", "financialStatements"] as const;
    const allItems = evidenceCategories.flatMap(
        c => Object.values(report.evidence[c]) as EvidenceItem<unknown>[]
    );
    const verifiedShare = allItems.length > 0
        ? Math.round((allItems.filter(i => i.verified).length / allItems.length) * 100)
        : 0;

    const topThesis = committee.reports.find(r => r.confidence > 0)?.thesis;

    return (

        <section className="space-y-4">

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">AI Committee</p>
                <p className={`mt-1 text-lg font-semibold ${RECOMMENDATION_COLOR[committee.recommendation] ?? "text-zinc-300"}`}>
                    {committee.recommendation.replace("_", " ")}
                </p>
                <p className="text-xs text-zinc-500">{committee.agreement}% agreement</p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Confidence</p>
                <p className="mt-1 text-lg font-semibold text-white">{committee.confidence}%</p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Evidence Feed</p>
                <p className="mt-1 text-lg font-semibold text-white">{verifiedShare}% verified</p>
                <p className="text-xs text-zinc-500">{allItems.length} fields tracked</p>
            </div>

            <MarketContext />

            {(() => {
                const articles = report.evidence.news.recentArticles.value;

                return (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Live News</p>
                        {articles.length === 0 ? (
                            <p className="mt-1 text-sm text-zinc-600">
                                No articles found in the last 30 days, or NEWS_API_KEY isn&apos;t configured.
                            </p>
                        ) : (
                            <ul className="mt-2 space-y-2">
                                {articles.slice(0, 3).map((a, i) => (
                                    <li key={i} className="text-sm">
                                        <p className="text-zinc-300 line-clamp-2">{a.title}</p>
                                        <p className="text-xs text-zinc-600">{a.source} · {new Date(a.publishedAt).toLocaleDateString()}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })()}

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Reasoning Trace</p>
                <p className="mt-1 text-sm italic text-zinc-400">
                    {topThesis ? `"${topThesis}"` : "No analyst had enough verified data to form a thesis."}
                </p>
            </div>

            <ResearchHistory />

        </section>

    );
}
