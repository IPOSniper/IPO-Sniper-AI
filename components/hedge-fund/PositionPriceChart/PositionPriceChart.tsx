"use client";

import { useEffect, useState } from "react";
import { getPositionBars } from "@/app/(app)/hedge-fund/position-chart/actions";
import type { PriceBar, BarTimeframe } from "@/engine/evidence/providers/AlpacaBarsProvider";

const RANGES: { label: string; timeframe: BarTimeframe; limit: number }[] = [
    { label: "1D", timeframe: "5Min", limit: 78 },   // ~6.5hr real trading day at 5min bars
    { label: "1W", timeframe: "1Hour", limit: 35 },
    { label: "1M", timeframe: "1Day", limit: 30 },
    { label: "3M", timeframe: "1Day", limit: 90 },
];

const CHART_WIDTH = 600;
const CHART_HEIGHT = 140;
const VOLUME_HEIGHT = 30;
const PADDING = 4;

/**
 * Real, first version of an interactive candlestick chart for one
 * open position's underlying ticker. Deliberately built as a plain,
 * self-contained SVG renderer rather than via recharts' <Customized>
 * (recharts has no native candlestick type, and its internal
 * xAxisMap/yAxisMap prop shape passed to Customized components isn't
 * reliably documented across versions -- getting it wrong would
 * silently fail to render, and this sandbox has no way to visually
 * verify recharts' internal behavior before shipping). Direct SVG
 * math is fully predictable and verifiable here instead.
 *
 * Real, honest scoping stated directly: shows real candlesticks,
 * real volume bars, a real entry-price reference line, and the real
 * current price -- NOT yet VWAP, moving averages, or
 * support/resistance levels (real, separate, additional
 * signal-computation work for a later round). Shows the
 * UNDERLYING's real price path, not the option contract's own real
 * premium path -- for an option position, this deliberately answers
 * "what did the underlying actually do," not "what did this specific
 * contract's price do" (no historical options-pricing data source
 * exists in this app for that).
 */
export default function PositionPriceChart({ ticker, entryPrice, currentPrice }: { ticker: string; entryPrice?: number; currentPrice?: number }) {
    const [rangeIndex, setRangeIndex] = useState(2); // default 1M
    const [bars, setBars] = useState<PriceBar[]>([]);
    const [loading, setLoading] = useState(true);

    const range = RANGES[rangeIndex];

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getPositionBars(ticker, range.timeframe, range.limit)
            .then(data => {
                if (!cancelled) setBars(data);
            })
            .catch(() => {
                if (!cancelled) setBars([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [ticker, range.timeframe, range.limit]);

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium text-zinc-300">{ticker} — Real Price</h4>
                <div className="flex gap-1">
                    {RANGES.map((r, i) => (
                        <button
                            key={r.label}
                            onClick={() => setRangeIndex(i)}
                            className={`rounded px-2 py-0.5 text-[10px] ${i === rangeIndex ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center text-[10px] text-zinc-600">Loading real price data…</div>
            ) : bars.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-[10px] text-zinc-600">Real price data unavailable for {ticker} at this range.</div>
            ) : (
                <CandlestickSvg bars={bars} entryPrice={entryPrice} />
            )}

            {!loading && bars.length > 0 && entryPrice !== undefined && currentPrice !== undefined && (
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Entry ${entryPrice.toFixed(2)}</span>
                    <span className={currentPrice >= entryPrice ? "text-emerald-400" : "text-red-400"}>Current ${currentPrice.toFixed(2)}</span>
                </div>
            )}
        </div>
    );
}

/**
 * Real, self-contained SVG candlestick + volume renderer. All
 * positioning math is plain, direct linear scaling -- no dependency
 * on any charting library's internal APIs.
 */
function CandlestickSvg({ bars, entryPrice }: { bars: PriceBar[]; entryPrice?: number }) {
    const plotWidth = CHART_WIDTH - PADDING * 2;
    const plotHeight = CHART_HEIGHT - VOLUME_HEIGHT - PADDING * 2;
    const volumeTop = CHART_HEIGHT - VOLUME_HEIGHT;

    const highs = bars.map(b => b.high);
    const lows = bars.map(b => b.low);
    const priceMax = entryPrice !== undefined ? Math.max(...highs, entryPrice) : Math.max(...highs);
    const priceMin = entryPrice !== undefined ? Math.min(...lows, entryPrice) : Math.min(...lows);
    const priceRange = Math.max(priceMax - priceMin, 0.01);

    const maxVolume = Math.max(1, ...bars.map(b => b.volume));

    const candleSlot = plotWidth / bars.length;
    const bodyWidth = Math.max(1, candleSlot * 0.6);

    const priceToY = (price: number) => PADDING + plotHeight - ((price - priceMin) / priceRange) * plotHeight;
    const entryY = entryPrice !== undefined ? priceToY(entryPrice) : null;

    return (
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-40 w-full">
            {entryY !== null && (
                <line x1={0} x2={CHART_WIDTH} y1={entryY} y2={entryY} stroke="#a1a1aa" strokeWidth={1} strokeDasharray="3 3" />
            )}
            {bars.map((bar, i) => {
                const x = PADDING + i * candleSlot + candleSlot / 2;
                const isUp = bar.close >= bar.open;
                const color = isUp ? "#34d399" : "#f87171";

                const yHigh = priceToY(bar.high);
                const yLow = priceToY(bar.low);
                const yOpen = priceToY(bar.open);
                const yClose = priceToY(bar.close);
                const bodyTop = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));

                const volHeight = (bar.volume / maxVolume) * (VOLUME_HEIGHT - 2);

                return (
                    <g key={bar.timestamp}>
                        <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1} />
                        <rect x={x - bodyWidth / 2} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} />
                        <rect
                            x={x - bodyWidth / 2}
                            y={volumeTop + (VOLUME_HEIGHT - volHeight)}
                            width={bodyWidth}
                            height={volHeight}
                            fill={color}
                            opacity={0.4}
                        />
                    </g>
                );
            })}
        </svg>
    );
}
