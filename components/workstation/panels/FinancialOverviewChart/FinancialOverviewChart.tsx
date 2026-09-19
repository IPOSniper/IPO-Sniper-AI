"use client";

import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import UnverifiedCard from "../../shared/UnverifiedCard";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatCurrency(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface ChartPoint {
  year: number;
  revenue: number;
  netIncome: number;
  netIncomePositive: number | null;
  netIncomeNegative: number | null;
}

function FinancialTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: number;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const revenue = payload.find((item) => item.dataKey === "revenue")?.value;
  const netIncome = payload.find(
    (item) => item.dataKey === "netIncome"
  )?.value;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-zinc-300">
        FY {label}
      </p>

      {typeof revenue === "number" && (
        <div className="flex items-center justify-between gap-6 text-xs">
          <span className="text-sky-300">Revenue</span>
          <span className="font-medium text-white">
            {formatFullCurrency(revenue)}
          </span>
        </div>
      )}

      {typeof netIncome === "number" && (
        <div className="mt-1 flex items-center justify-between gap-6 text-xs">
          <span
            className={
              netIncome >= 0 ? "text-emerald-300" : "text-red-300"
            }
          >
            Net Income
          </span>
          <span className="font-medium text-white">
            {formatFullCurrency(netIncome)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Financial visualization is driven directly from the verified
 * FinancialStatement[] evidence package.
 *
 * Revenue and Net Income are shown on separate axes because their
 * magnitudes can differ substantially. Net income is explicitly
 * colored by sign: positive = green, negative = red.
 *
 * No synthetic periods or placeholder financial values are created.
 */
export default function FinancialOverviewChart({
  research,
}: WorkstationPanelProps) {
  const evidence = research.report.evidence.financialStatements.statements;

  if (!evidence.verified || evidence.value.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-zinc-300">
          Financial Overview
        </h2>

        <UnverifiedCard
          title="Multi-Year Revenue / Net Income"
          reason="Could not fetch or map verified financial-statement data for this ticker. No financial trend is drawn."
        />
      </div>
    );
  }

  const statements = [...evidence.value].sort(
    (a, b) => a.fiscalYear - b.fiscalYear
  );

  const chartData: ChartPoint[] = statements.map((statement) => ({
    year: statement.fiscalYear,
    revenue: statement.revenue,
    netIncome: statement.netIncome,
    netIncomePositive:
      statement.netIncome >= 0 ? statement.netIncome : null,
    netIncomeNegative:
      statement.netIncome < 0 ? statement.netIncome : null,
  }));

  const latest = statements[statements.length - 1];
  const prior =
    statements.length > 1 ? statements[statements.length - 2] : null;

  const revenueGrowth =
    prior && prior.revenue !== 0
      ? ((latest.revenue - prior.revenue) / Math.abs(prior.revenue)) * 100
      : null;

  const grossMargin =
    latest.revenue !== 0
      ? (latest.grossProfit / latest.revenue) * 100
      : null;

  const netMargin =
    latest.revenue !== 0
      ? (latest.netIncome / latest.revenue) * 100
      : null;

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Financial Performance
              </h2>
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              Annual revenue and net income from verified financial statements
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-zinc-300">
              {statements.length} fiscal year
              {statements.length !== 1 ? "s" : ""}
            </p>
            <p className="text-[11px] text-zinc-600">
              SEC XBRL via Finnhub
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 pt-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />

              <XAxis
                dataKey="year"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#3f3f46" }}
              />

              <YAxis
                yAxisId="revenue"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
                width={48}
              />

              <YAxis
                yAxisId="netIncome"
                orientation="right"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
                width={48}
              />

              <Tooltip
                content={<FinancialTooltip />}
                cursor={{ fill: "rgba(113,113,122,0.08)" }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconType="circle"
                wrapperStyle={{
                  fontSize: 11,
                  color: "#a1a1aa",
                }}
              />

              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                name="Revenue"
                fill="#38bdf8"
                radius={[3, 3, 0, 0]}
                maxBarSize={42}
              />

              <Line
                yAxisId="netIncome"
                dataKey="netIncomePositive"
                name="Net Income"
                stroke="#34d399"
                strokeWidth={3}
                dot={{ r: 3, fill: "#34d399" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                legendType="circle"
              />

              <Line
                yAxisId="netIncome"
                dataKey="netIncomeNegative"
                name="Net Income"
                stroke="#f87171"
                strokeWidth={3}
                dot={{ r: 3, fill: "#f87171" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                legendType="circle"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-zinc-900 pt-2 text-[10px] text-zinc-600">
          <span>
            Bars = Revenue
          </span>
          <span>
            Line = Net Income
          </span>
          <span>
            Green = positive
          </span>
          <span>
            Red = negative
          </span>
          <span>
            Left/right axes use separate scales
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-zinc-800 sm:grid-cols-4">
        <div className="border-r border-zinc-800 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Revenue Growth
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {revenueGrowth !== null
              ? `${revenueGrowth.toFixed(1)}%`
              : "N/A"}
          </p>
          <p className="text-[10px] text-zinc-600">YoY</p>
        </div>

        <div className="border-r border-zinc-800 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Gross Margin
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {grossMargin !== null
              ? `${grossMargin.toFixed(1)}%`
              : "N/A"}
          </p>
          <p className="text-[10px] text-zinc-600">Latest FY</p>
        </div>

        <div className="border-r border-zinc-800 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Net Margin
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {netMargin !== null
              ? `${netMargin.toFixed(1)}%`
              : "N/A"}
          </p>
          <p className="text-[10px] text-zinc-600">Latest FY</p>
        </div>

        <div className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Net Income
          </p>
          <p
            className={`mt-1 text-base font-semibold ${
              latest.netIncome >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {formatCurrency(latest.netIncome)}
          </p>
          <p className="text-[10px] text-zinc-600">
            FY {latest.fiscalYear}
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-900 px-5 py-3">
        <p className="text-[10px] leading-4 text-zinc-600">
          Evidence confidence {evidence.confidence}%. Financial values are
          mapped from SEC XBRL tags through Finnhub. Missing or unmappable
          periods are not replaced with estimates or placeholders.
        </p>
      </div>
    </section>
  );
}
