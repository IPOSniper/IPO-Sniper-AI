"use client";

import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import UnverifiedCard from "../../shared/UnverifiedCard";

/**
 * Real data, rebucketed for display: NewsBuilder's sentimentScore is
 * a single -100..100 keyword-heuristic number (see newsBuilder.ts
 * for its real limitations). This just converts that ONE number into
 * a 3-way visual split — it does NOT have per-article sentiment
 * classification, so this is an approximation of the aggregate score,
 * not a genuine breakdown of individual articles' sentiment.
 */
export default function NewsSentimentDonut({ research }: WorkstationPanelProps) {
    const { news } = research.report.evidence;

    if (!news.sentimentScore.verified && news.sentimentScore.confidence === 0) {
        return <UnverifiedCard title="News Sentiment" reason="No NEWS_API_KEY configured, or no articles found" />;
    }

    const score = news.sentimentScore.value; // -100..100

    // Simple, correct split: score maps directly to whichever side
    // it's on, with neutral as the honest leftover. The previous
    // formula for `negative` was mathematically degenerate — it
    // evaluated to 0 for every possible input from -100 to 100,
    // meaning a maximally negative score (-100, exactly what drove a
    // real SELL vote) rendered as "0% Negative, 100% Neutral." Caught
    // via a live screenshot, not a code review — the bug wasn't
    // visible from reading the formula in isolation.
    const positive = score > 0 ? Math.round(score) : 0;
    const negative = score < 0 ? Math.round(-score) : 0;
    const neutral = 100 - positive - negative;

    const dominant = positive >= negative && positive >= neutral
        ? { label: "Positive", value: positive }
        : negative >= neutral
        ? { label: "Negative", value: negative }
        : { label: "Neutral", value: neutral };

    const data = [
        { name: "Positive", value: positive, color: "#34d399" },
        { name: "Neutral", value: neutral, color: "#71717a" },
        { name: "Negative", value: negative, color: "#f87171" },
    ];

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="mb-2 text-lg font-semibold">News Sentiment</h2>

            <div className="flex items-center gap-4">
                <div className="relative h-32 w-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} dataKey="value" innerRadius={40} outerRadius={60} startAngle={90} endAngle={-270}>
                                {data.map(d => <Cell key={d.name} fill={d.color} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-white">{dominant.value}%</span>
                        <span className="text-[10px] text-zinc-500">{dominant.label}</span>
                    </div>
                </div>

                <div className="space-y-1.5 text-sm">
                    {data.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-zinc-400">{d.name}</span>
                            <span className="ml-auto font-medium text-white">{d.value}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-3 text-xs text-zinc-600">
                Based on {news.articleCount.value} articles, last 30 days. Keyword heuristic, not per-article NLP — see newsBuilder.ts.
            </p>
        </div>
    );
}
