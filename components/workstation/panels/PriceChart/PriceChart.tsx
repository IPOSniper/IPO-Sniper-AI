"use client";

import { useEffect, useState } from "react";
import { ComposedChart, BarChart, Bar, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Point {
 date: string;
 close: number;
 volume: number | null;
}

interface ChartPoint extends Point {
 sma20: number | null;
 ema9: number | null;
}

const RANGES = ["1M", "3M", "1Y", "5Y", "Max"] as const;
type Range = typeof RANGES[number];

const SMA_PERIOD = 20;
const EMA_PERIOD = 9;

const PRICE_CHART_LOGO_BASE = "https://images.financialmodelingprep.com/symbol/";

function computeSmaSeries(closes: number[], period: number): (number | null)[] {
 return closes.map((_, i) => {
 if (i < period - 1) return null;
 const slice = closes.slice(i - period + 1, i + 1);
 return slice.reduce((a, b) => a + b, 0) / period;
 });
}

function computeEmaSeries(closes: number[], period: number): (number | null)[] {
 const result: (number | null)[] = new Array(closes.length).fill(null);
 if (closes.length < period) return result;
 const k = 2 / (period + 1);
 let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
 result[period - 1] = ema;
 for (let i = period; i < closes.length; i++) {
 ema = closes[i] * k + ema * (1 - k);
 result[i] = ema;
 }
 return result;
}

function formatDateTick(dateStr: string, pointCount: number): string {
 const d = new Date(dateStr);
 if (Number.isNaN(d.getTime())) return dateStr;
 if (pointCount > 400) return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
 return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Real fix for the Recharts type-check failure: labelFormatter/formatter
// receive params typed as possibly-undefined ReactNode/ValueType, not
// plain string/number -- accept `unknown` and coerce at runtime instead
// of typing the parameter narrowly (which is what broke the build).
function formatTooltipLabel(label: unknown): string {
 const d = new Date(String(label));
 if (Number.isNaN(d.getTime())) return String(label ?? "");
 return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function PriceChart({ ticker }: { ticker: string }) {
 const [range, setRange] = useState<Range>("3M");
 const [points, setPoints] = useState<Point[]>([]);
 const [loading, setLoading] = useState(true);
 const [available, setAvailable] = useState(true);
 const [logoFailed, setLogoFailed] = useState(false);

 useEffect(() => {
 setLogoFailed(false);
 }, [ticker]);

 useEffect(() => {
 let cancelled = false;
 setLoading(true);

 fetch(`/api/quote/${ticker}/candles?range=${range}`)
 .then(res => res.json())
 .then(data => {
 if (cancelled) return;
 setPoints(data.points ?? []);
 setAvailable(data.available ?? false);
 })
 .catch(() => {
 if (!cancelled) setAvailable(false);
 })
 .finally(() => {
 if (!cancelled) setLoading(false);
 });

 return () => { cancelled = true; };
 }, [ticker, range]);

 const isUp = points.length >= 2 && points[points.length - 1].close >= points[0].close;

 const closes = points.map(p => p.close);
 const sma20Series = computeSmaSeries(closes, SMA_PERIOD);
 const ema9Series = computeEmaSeries(closes, EMA_PERIOD);
 const chartData: ChartPoint[] = points.map((p, i) => ({ ...p, sma20: sma20Series[i], ema9: ema9Series[i] }));
 const hasEnoughForSma = points.length >= SMA_PERIOD;
 const hasEnoughForEma = points.length >= EMA_PERIOD;
 const hasVolume = points.some(p => p.volume !== null);

 return (
 <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 {!logoFailed && (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={`${PRICE_CHART_LOGO_BASE}${ticker}.png`}
 alt=""
 className="h-5 w-5 rounded-sm bg-white/5 object-contain"
 onError={() => setLogoFailed(true)}
 />
 )}
 <h2 className="text-sm font-semibold text-zinc-300">Price</h2>
 </div>
 <div className="flex gap-1">
 {RANGES.map(r => (
 <button
 key={r}
 onClick={() => setRange(r)}
 className={`text-xs px-2 py-1 rounded ${
 range === r ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
 }`}
 >
 {r}
 </button>
 ))}
 </div>
 </div>

 <div className={hasVolume ? "h-52" : "h-56"}>
 {loading ? (
 <div className="h-full flex items-center justify-center text-xs text-zinc-600">Loading-</div>
 ) : !available || points.length === 0 ? (
 <div className="h-full flex items-center justify-center text-xs text-zinc-600">
 Price history unavailable - check FINNHUB_API_KEY / plan access to /stock/candle.
 </div>
 ) : points.length === 1 ? (
 <div className="h-full flex flex-col items-center justify-center gap-1 text-center">
 <p className="text-2xl font-bold text-white">${points[0].close.toFixed(2)}</p>
 <p className="text-xs text-zinc-500">New listing - 1 trading day of history available for this range</p>
 <p className="text-[10px] text-zinc-600">A real trend chart needs at least 2 data points</p>
 </div>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
 <defs>
 <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={isUp ? "#34d399" : "#f87171"} stopOpacity={0.35} />
 <stop offset="100%" stopColor={isUp ? "#34d399" : "#f87171"} stopOpacity={0} />
 </linearGradient>
 </defs>
 <XAxis
 dataKey="date"
 tick={{ fill: "#71717a", fontSize: 9 }}
 tickFormatter={(d: string) => formatDateTick(d, points.length)}
 axisLine={{ stroke: "#3f3f46" }}
 tickLine={false}
 minTickGap={40}
 hide={hasVolume}
 />
 <YAxis
 domain={["auto", "auto"]}
 width={54}
 tick={{ fill: "#71717a", fontSize: 10 }}
 tickFormatter={(v: number) => `$${v.toFixed(v < 10 ? 2 : 0)}`}
 axisLine={{ stroke: "#3f3f46" }}
 tickLine={false}
 />
 <Tooltip
 contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }}
 labelStyle={{ color: "#a1a1aa" }}
 labelFormatter={formatTooltipLabel}
 formatter={(value: unknown, name: unknown) => {
 const n = typeof value === "number" ? value : Number(value);
 if (!Number.isFinite(n)) return ["-", String(name)];
 const label = name === "close" ? "Close" : name === "sma20" ? "SMA 20" : name === "ema9" ? "EMA 9" : String(name);
 return [`$${n.toFixed(2)}`, label];
 }}
 />
 <Area
 type="monotone"
 dataKey="close"
 name="close"
 stroke={isUp ? "#34d399" : "#f87171"}
 strokeWidth={1.5}
 fill="url(#priceFill)"
 />
 {hasEnoughForSma && (
 <Line type="monotone" dataKey="sma20" name="sma20" stroke="#60a5fa" strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
 )}
 {hasEnoughForEma && (
 <Line type="monotone" dataKey="ema9" name="ema9" stroke="#fbbf24" strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
 )}
 </ComposedChart>
 </ResponsiveContainer>
 )}
 </div>

 {!loading && available && points.length > 1 && hasVolume && (
 <div className="h-10 mt-0.5">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={chartData} margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
 <XAxis
 dataKey="date"
 tick={{ fill: "#71717a", fontSize: 9 }}
 tickFormatter={(d: string) => formatDateTick(d, points.length)}
 axisLine={{ stroke: "#3f3f46" }}
 tickLine={false}
 minTickGap={40}
 />
 <Tooltip
 contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }}
 labelStyle={{ color: "#a1a1aa" }}
 labelFormatter={formatTooltipLabel}
 formatter={(value: unknown) => {
 const n = typeof value === "number" ? value : Number(value);
 return [Number.isFinite(n) ? n.toLocaleString() : "-", "Volume"];
 }}
 />
 <Bar dataKey="volume" fill="#3f3f46" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 )}

 {!loading && available && points.length > 1 && !hasEnoughForSma && (
 <p className="mt-1 text-[10px] text-zinc-600">SMA 20 needs at least 20 real data points - only {points.length} available for this range.</p>
 )}

 {!loading && available && points.length > 1 && (
 <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-900 pt-2 text-[10px] leading-relaxed">
 <span className="flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full" style={{ background: isUp ? "#34d399" : "#f87171" }} />
 <span className="text-zinc-400"><span className="font-medium text-zinc-200">Close</span> - the real daily closing price.</span>
 </span>
 {hasEnoughForEma && (
 <span className="flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-amber-400" />
 <span className="text-zinc-400"><span className="font-medium text-zinc-200">EMA 9</span> - 9-day average weighted toward recent days, short-term direction.</span>
 </span>
 )}
 {hasEnoughForSma && (
 <span className="flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-blue-400" />
 <span className="text-zinc-400"><span className="font-medium text-zinc-200">SMA 20</span> - plain 20-day average, longer-term trend.</span>
 </span>
 )}
 {hasVolume && (
 <span className="flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-sm bg-zinc-600" />
 <span className="text-zinc-400"><span className="font-medium text-zinc-200">Volume</span> - shares traded each day.</span>
 </span>
 )}
 </div>
 )}
 </section>
 );
}