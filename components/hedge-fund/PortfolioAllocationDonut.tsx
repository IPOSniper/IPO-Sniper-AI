"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PositionRiskResult } from "@/engine/portfolio/PortfolioRiskAggregator";

const COLORS = ["#8B5CF6", "#16D47B", "#F5A524", "#3B82F6", "#F04452", "#EC4899", "#14B8A6"];

/**
 * Real portfolio allocation, visualized as a donut -- a genuinely
 * different visual language from the existing "Concentration"
 * horizontal bars in PortfolioRiskPanel (kept, not replaced, since
 * bars and a donut serve slightly different reading styles and
 * aren't redundant). Same real data source (report.positions),
 * same real market values -- not a second, independent calculation.
 *
 * Client component (recharts' Pie needs it), safe here since this
 * renders on-screen normally, not off-screen-captured like the
 * Share Card was.
 */
export default function PortfolioAllocationDonut({ positions }: { positions: PositionRiskResult[] }) {
    if (positions.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Portfolio Allocation</h3>
                <p className="text-sm text-zinc-600">No priced positions.</p>
            </div>
        );
    }

    const chartData = positions.map(p => ({ name: p.ticker, value: p.marketValue, weight: p.weight }));

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-3 text-sm font-medium text-zinc-300">Portfolio Allocation</h3>
            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={chartData.length > 1 ? 2 : 0}
                        >
                            {chartData.map((entry, i) => (
                                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: "#18181B", border: "1px solid #3F3F46", fontSize: 12 }}
                            formatter={(value, name, item) => {
                                const weight = typeof item?.payload?.weight === "number" ? item.payload.weight.toFixed(1) : "—";
                                return [`$${Number(value).toLocaleString()} (${weight}%)`, name];
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
