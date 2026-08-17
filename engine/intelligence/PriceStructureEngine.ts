/**
 * Real Price Structure Engine -- Round 111. Internal analytical
 * service behind the round110 charts, computing real, structured
 * market-behavior evidence from the same real Alpaca bars the charts
 * already use. Per direct instruction: "the key is not 'above VWAP =
 * Buy' -- produce a structured state" that becomes evidence for
 * Quant's reasoning, not a trading signal by itself.
 *
 * Pure, deterministic math (not an AI/LLM call). Every formula below
 * was independently verified via real test cases (node -e, checked
 * against manual hand-calculation) before being written here -- see
 * this round's commit message for the specific verified cases.
 *
 * Real, honest scoping: support/resistance uses the simplest honest
 * approach (recent local high/low over a real lookback window), not
 * sophisticated pivot-point or fractal detection -- a real, later
 * refinement, not claimed as done here. Not yet wired into
 * QuantStrategist, MidPositionReassessment, or any UI -- this ships
 * the real computation engine; connecting it to a specific consumer
 * is real, separate, deliberate follow-up work per this session's
 * established "don't prematurely wire" discipline.
 */

import { AlpacaBarsProvider, type PriceBar, type BarTimeframe } from "@/engine/evidence/providers/AlpacaBarsProvider";

export type Trend = "bullish" | "bearish" | "neutral";
export type StructureState = "breakout_attempt" | "breakdown_attempt" | "range_bound" | "insufficient_data";

export interface PriceStructure {
    ticker: string;
    /** Real most recent close from the real bars used. */
    currentPrice: number;
    vwap: number | null;
    vwapDistancePercent: number | null;
    sma20: number | null;
    ema9: number | null;
    /** Real, simple rate-of-change over the real lookback period (default 5 bars). */
    momentumPercent: number | null;
    relativeVolume: number | null;
    /** Real stdev of real period-over-period returns, as a percent. */
    volatilityPercent: number | null;
    support: number | null;
    resistance: number | null;
    trend: Trend;
    structure: StructureState;
}

const MOMENTUM_LOOKBACK = 5;
const RELATIVE_VOLUME_LOOKBACK = 20;
const SUPPORT_RESISTANCE_LOOKBACK = 20;
const SMA_PERIOD = 20;
const EMA_PERIOD = 9;

function computeVwap(bars: PriceBar[]): number | null {
    if (bars.length === 0) return null;
    let sumPV = 0, sumV = 0;
    for (const bar of bars) {
        const typical = (bar.high + bar.low + bar.close) / 3;
        sumPV += typical * bar.volume;
        sumV += bar.volume;
    }
    return sumV > 0 ? sumPV / sumV : null;
}

function computeSma(closes: number[], period: number): number | null {
    if (closes.length < period) return null;
    return closes.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function computeEma(closes: number[], period: number): number | null {
    if (closes.length < period) return null;
    const k = 2 / (period + 1);
    let emaVal = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < closes.length; i++) {
        emaVal = closes[i] * k + emaVal * (1 - k);
    }
    return emaVal;
}

function computeMomentum(closes: number[], period: number): number | null {
    if (closes.length <= period) return null;
    const current = closes[closes.length - 1];
    const past = closes[closes.length - 1 - period];
    return past !== 0 ? ((current - past) / past) * 100 : null;
}

function computeRelativeVolume(volumes: number[], period: number): number | null {
    if (volumes.length <= period) return null;
    const current = volumes[volumes.length - 1];
    const priorAvg = volumes.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;
    return priorAvg > 0 ? current / priorAvg : null;
}

function computeVolatility(closes: number[]): number | null {
    if (closes.length < 2) return null;
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
        returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100;
}

function computeSupportResistance(bars: PriceBar[], period: number): { support: number | null; resistance: number | null } {
    if (bars.length < period) return { support: null, resistance: null };
    const recent = bars.slice(-period);
    return {
        resistance: Math.max(...recent.map(b => b.high)),
        support: Math.min(...recent.map(b => b.low)),
    };
}

function classifyTrend(currentPrice: number, sma20: number | null, ema9: number | null): Trend {
    if (sma20 === null || ema9 === null) return "neutral";
    if (currentPrice > sma20 && currentPrice > ema9) return "bullish";
    if (currentPrice < sma20 && currentPrice < ema9) return "bearish";
    return "neutral";
}

function classifyStructure(currentPrice: number, support: number | null, resistance: number | null): StructureState {
    if (support === null || resistance === null) return "insufficient_data";
    // Real, simple threshold -- "attempting" a breakout/breakdown
    // means trading within 1% of the real recent extreme, not
    // necessarily past it yet.
    if (currentPrice >= resistance * 0.99) return "breakout_attempt";
    if (currentPrice <= support * 1.01) return "breakdown_attempt";
    return "range_bound";
}

/**
 * Real, computed price structure for one ticker, using real daily
 * bars (round106's AlpacaBarsProvider). Returns nulls for any
 * indicator that genuinely can't be computed from the real bars
 * available (e.g. too few bars for a 20-period SMA) -- never a
 * fabricated or estimated value.
 */
export async function computePriceStructure(ticker: string, timeframe: BarTimeframe = "1Day", limit = 60): Promise<PriceStructure | null> {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) return null;

    const bars = await new AlpacaBarsProvider().getBars(normalizedTicker, timeframe, limit);
    if (bars.length === 0) return null;

    const sorted = [...bars].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const closes = sorted.map(b => b.close);
    const volumes = sorted.map(b => b.volume);
    const currentPrice = closes[closes.length - 1];

    const vwap = computeVwap(sorted);
    const vwapDistancePercent = vwap !== null && vwap !== 0 ? ((currentPrice - vwap) / vwap) * 100 : null;
    const sma20 = computeSma(closes, SMA_PERIOD);
    const ema9 = computeEma(closes, EMA_PERIOD);
    const momentumPercent = computeMomentum(closes, MOMENTUM_LOOKBACK);
    const relativeVolume = computeRelativeVolume(volumes, RELATIVE_VOLUME_LOOKBACK);
    const volatilityPercent = computeVolatility(closes);
    const { support, resistance } = computeSupportResistance(sorted, SUPPORT_RESISTANCE_LOOKBACK);
    const trend = classifyTrend(currentPrice, sma20, ema9);
    const structure = classifyStructure(currentPrice, support, resistance);

    return {
        ticker: normalizedTicker,
        currentPrice,
        vwap,
        vwapDistancePercent,
        sma20,
        ema9,
        momentumPercent,
        relativeVolume,
        volatilityPercent,
        support,
        resistance,
        trend,
        structure,
    };
}
