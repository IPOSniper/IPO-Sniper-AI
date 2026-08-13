"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PositionRiskResult } from "@/engine/portfolio/PortfolioRiskAggregator";
import type { TradingAccount } from "@/engine/trading/contracts/TradeOrder";

const COLORS = ["#8B5CF6", "#16D47B", "#F5A524", "#3B82F6", "#F04452", "#EC4899", "#14B8A6"];
const CASH_COLOR = "#3F3F46";

/**
 * Real portfolio allocation, visualized as a donut -- a genuinely
 * different visual language from the existing "Concentration"
 * horizontal bars in PortfolioRiskPanel (kept, not replaced, since
 * bars and a donut serve slightly different reading styles and
 * aren't redundant). Same real data source (report.positions), same
 * real market values -- not a second, independent calculation.
 *
 * Now includes a real Cash slice -- the previous version only showed
 * priced positions, which is exactly the same "excludes cash"
 * limitation an earlier audit this session flagged on
 * PositionRiskResult.weight (renamed to "Weight (of analyzed)"
 * there rather than fixed, since fixing it there would've meant
 * changing what report.concentration measures). Here, fixed
 * properly: every slice's % (including Cash) is computed against
 * the SAME real total (all positions + cash), not two different
 * denominators shown side by side.
 *
 * Client component (recharts' Pie needs it), safe here since this
 * renders on-screen normally, not off-screen-captured like the
 * Share Card was.
 */
export default function PortfolioAllocationDonut({
    positions,
    account,
}: {
    positions: PositionRiskResult[];
    account: TradingAccount | null;
}) {
    if (positions.length === 0 && !account) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">Portfolio Allocation</h3>
                <p className="text-sm text-zinc-600">No priced positions.</p>
            </div>
        );
    }

    const positionsTotal = positions.reduce((sum, p) => sum + p.marketValue, 0);
    const cashValue = account ? Math.max(0, account.cash) : 0;
    const grandTotal = positionsTotal + cashValue;

    const chartData = [
        ...positions.map(p => ({ name: p.ticker, value: p.marketValue, weight: grandTotal > 0 ? (p.marketValue / grandTotal) * 100 : 0, isCash: false })),
        ...(cashValue > 0 ? [{ name: "Cash", value: cashValue, weight: grandTotal > 0 ? (cashValue / grandTotal) * 100 : 0, isCash: true }] : []),
    ];

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Portfolio Allocation</h3>
                <span className="text-[10px] text-zinc-600">Real — includes cash, all %s against the same total</span>
            </div>
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
                                <Cell key={entry.name} fill={entry.isCash ? CASH_COLOR : COLORS[i % COLORS.length]} />
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
