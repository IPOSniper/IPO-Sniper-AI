"use client";

import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "#34d399",
    BUY: "#34d399",
    HOLD: "#a1a1aa",
    REDUCE: "#fbbf24",
    SELL: "#f87171",
};

/**
 * Maps real per-analyst scores onto the mockup's conviction
 * dimensions. Each dimension pulls from a specific real analyst
 * (Growth<-GrowthAnalyst, Profitability<-MarginAnalyst, etc.) rather
 * than an invented composite — if that analyst didn't have enough
 * data to vote, the dimension shows 0, not a guess.
 */
export default function ConvictionRadar({ research }: WorkstationPanelProps) {
    const { committee } = research;

    const scoreFor = (analystName: string): number => {
        const report = committee.reports.find(r => r.analyst === analystName);
        return report && report.confidence > 0 ? report.score : 0;
    };

    const data = [
        { dimension: "Growth", score: scoreFor("Growth Analyst") },
        { dimension: "Profitability", score: scoreFor("Margin Analyst") },
        { dimension: "Cash Flow", score: scoreFor("Cash Flow Analyst") },
        { dimension: "Balance Sheet", score: scoreFor("Balance Sheet Analyst") },
        { dimension: "Risk Profile", score: scoreFor("Risk Analyst") },
        { dimension: "Valuation", score: scoreFor("Valuation Analyst") },
    ];

    const color = RECOMMENDATION_COLOR[committee.recommendation] ?? "#a1a1aa";

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Institutional Conviction</h2>
                <div className="text-right">
                    <p className="text-2xl font-bold text-white">{committee.overallScore}<span className="text-sm text-zinc-500">/100</span></p>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data}>
                        <PolarGrid stroke="#3f3f46" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                        <Radar dataKey="score" stroke={color} fill={color} fillOpacity={0.35} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <p className="mt-2 text-center text-xs text-zinc-600">
                Dimensions at 0 mean that analyst didn&apos;t have enough verified data to vote, not a bearish score.
            </p>
        </div>
    );
}
