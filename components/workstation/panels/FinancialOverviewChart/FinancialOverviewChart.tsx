"use client";

import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import UnverifiedCard from "../../shared/UnverifiedCard";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart } from "recharts";

function formatCurrency(value: number): string {
 const abs = Math.abs(value);
 if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
 if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
 return value.toLocaleString();
}

/**
 * Real, multi-year data as of this wiring: FinnhubFinancialStatementsProvider
 * fetches actual SEC XBRL filing data via Finnhub's /financials-reported
 * endpoint (freq=annual), mapped by FinnhubFinancialStatementMapper's
 * fallback logic across XBRL tag variants. See financialStatementsBuilder.ts
 * for the honest-failure behavior when this can't be fetched/mapped.
 */
export default function FinancialOverviewChart({ research }: WorkstationPanelProps) {
 const evidence = research.report.evidence.financialStatements.statements;

 if (!evidence.verified || evidence.value.length === 0) {
 return (
 <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
 <h2 className="mb-3 text-lg font-semibold text-zinc-400">Financial Overview</h2>
 <UnverifiedCard
 title="Multi-Year Revenue / Net Income"
 reason="Could not fetch or map SEC filing data for this ticker - see financialStatementsBuilder.ts."
 />
 </div>
 );
 }

 const statements = evidence.value;
 const chartData = statements.map(s => ({
 year: s.fiscalYear,
 revenue: s.revenue,
 netIncome: s.netIncome,
 }));

 const latest = statements[statements.length - 1];
 const prior = statements.length > 1 ? statements[statements.length - 2] : null;

 const revenueGrowth = prior && prior.revenue !== 0
 ? ((latest.revenue - prior.revenue) / Math.abs(prior.revenue)) * 100
 : null;

 const grossMargin = latest.revenue !== 0 ? (latest.grossProfit / latest.revenue) * 100 : null;
 const netMargin = latest.revenue !== 0 ? (latest.netIncome / latest.revenue) * 100 : null;

 return (
 <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
 <div className="mb-3 flex items-center justify-between">
 <h2 className="text-lg font-semibold">Financial Overview</h2>
 <span className="text-xs text-zinc-600">
 {statements.length} fiscal year{statements.length !== 1 ? "s" : ""} - SEC filings via Finnhub
 </span>
 </div>

 <div className="h-56 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={chartData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
 <XAxis dataKey="year" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
 <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={formatCurrency} width={50} />
 <Bar dataKey="revenue" fill="#38bdf8" name="Revenue" radius={[4, 4, 0, 0]} />
 <Line dataKey="netIncome" stroke="#34d399" strokeWidth={2} name="Net Income" dot={{ r: 3 }} />
 </ComposedChart>
 </ResponsiveContainer>
 </div>

 <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
 <div>
 <p className="text-xs text-zinc-500">Revenue Growth (YoY)</p>
 <p className="text-lg font-semibold text-white">
 {revenueGrowth !== null ? `${revenueGrowth.toFixed(1)}%` : "N/A - 1yr data"}
 </p>
 </div>
 <div>
 <p className="text-xs text-zinc-500">Gross Margin</p>
 <p className="text-lg font-semibold text-white">
 {grossMargin !== null ? `${grossMargin.toFixed(1)}%` : "N/A"}
 </p>
 </div>
 <div>
 <p className="text-xs text-zinc-500">Net Margin</p>
 <p className="text-lg font-semibold text-white">
 {netMargin !== null ? `${netMargin.toFixed(1)}%` : "N/A"}
 </p>
 </div>
 <div>
 <p className="text-xs text-zinc-500">Latest FY Net Income</p>
 <p className="text-lg font-semibold text-white">
 {formatCurrency(latest.netIncome)}
 </p>
 </div>
 </div>

 <p className="mt-3 text-xs text-zinc-600">
 Confidence {evidence.confidence}% - mapped from SEC XBRL tags with fallback across common
 variants; unconventional filers may have gaps. See FinnhubFinancialStatementMapper.ts.
 </p>
 </div>
 );
}
