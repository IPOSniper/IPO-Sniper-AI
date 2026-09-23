"use client";

import { useEffect, useState } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Point {
 date: string;
 close: number;
}

interface ChartPoint extends Point {
 sma20: number | null;
 ema9: number | null;
}

// Added 5Y/Max: a new user researching a company's real long-term
// story previously had no way to see anything past 1 year -- the
// underlying data source (Finnhub, falling back to Alpaca) can
// return real multi-year history, the range picker just never
// offered it.
const RANGES = ["1M", "3M", "1Y", "5Y", "Max"] as const;
type Range = typeof RANGES[number];

const SMA_PERIOD = 20;
const EMA_PERIOD = 9;

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

export default function PriceChart({ ticker }: { ticker: string }) {
 const [range, setRange] = useState<Range>("3M");
 const [points, setPoints] = useState<Point[]>([]);
 const [loading, setLoading] = useState(true);
 const [available, setAvailable] = useState(true);

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

 return (
 <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
 <div className="flex items-center justify-between mb-2">
 <h2 className="text-sm font-semibold text-zinc-300">Price</h2>
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

 <div className="h-56">
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
 <XAxis dataKey="date" hide />
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
 formatter={(value, name) => {
 const n = typeof value === "number" ? value : Number(value);
 if (!Number.isFinite(n)) return ["-", name];
 const label = name === "close" ? "Close" : name === "sma20" ? "SMA 20" : name === "ema9" ? "EMA 9" : name;
 return [`$${n.toFixed(2)}`, label];
 }}
 />
 <Area
 type="monotone"
 dataKey="close"
 stroke={isUp ? "#34d399" : "#f87171"}
 strokeWidth={1.5}
 fill="url(#priceFill)"
 />
 {hasEnoughForSma && (
 <Line type="monotone" dataKey="sma20" stroke="#60a5fa" strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
 )}
 {hasEnoughForEma && (
 <Line type="monotone" dataKey="ema9" stroke="#fbbf24" strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
 )}
 {(hasEnoughForSma || hasEnoughForEma) && (
 <Legend
 wrapperStyle={{ fontSize: 10 }}
 formatter={(value) => (value === "sma20" ? "SMA 20" : value === "ema9" ? "EMA 9" : value)}
 />
 )}
 </ComposedChart>
 </ResponsiveContainer>
 )}
 </div>

 {!loading && available && points.length > 1 && !hasEnoughForSma && (
 <p className="mt-1 text-[10px] text-zinc-600">SMA 20 needs at least 20 real data points - only {points.length} available for this range.</p>
 )}

 {!loading && available && points.length > 1 && (
 <p className="mt-2 border-t border-zinc-900 pt-2 text-[10px] leading-relaxed text-zinc-600">
 <span className="text-red-400">What am I looking at?</span>{" "}
 <span className="text-emerald-400 font-medium">Close price</span> is the real daily closing price.{" "}
 <span className="font-medium" style={{ color: "#fbbf24" }}>EMA 9</span> is a 9-day average weighted toward recent days, showing short-term direction.{" "}
 <span className="font-medium" style={{ color: "#60a5fa" }}>SMA 20</span> is a plain 20-day average, showing the slower, longer-term trend.
 </p>
 )}
 </section>
 );
}