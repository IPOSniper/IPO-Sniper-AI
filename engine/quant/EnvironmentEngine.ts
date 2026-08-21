import { AlpacaBarsProvider } from "@/engine/evidence/providers/AlpacaBarsProvider";
import { computePriceStructure, type Trend, type StructureState } from "@/engine/intelligence/PriceStructureEngine";

export type MarketRegime = "risk_on" | "neutral" | "risk_off";
export type TrendRegime = "trending" | "range_bound" | "transitional";
export type TimeOfDay = "open" | "early_session" | "midday" | "late_session" | "close" | "market_closed";

export interface MarketEnvironment {
    marketRegime: MarketRegime;
    marketRegimeBasis: string;
    timeOfDay: TimeOfDay;
    timeOfDayEt: string;
}

export interface TickerEnvironment {
    ticker: string;
    trendRegime: TrendRegime;
    trend: Trend;
    structure: StructureState;
}

export function classifyTimeOfDay(): { timeOfDay: TimeOfDay; timeOfDayEt: string } {
    const now = new Date();
    const etFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        weekday: "short",
    });
    const parts = etFormatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === "hour")?.value ?? "0", 10);
    const minute = parseInt(parts.find(p => p.type === "minute")?.value ?? "0", 10);
    const weekday = parts.find(p => p.type === "weekday")?.value ?? "";
    const timeOfDayEt = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ET ${weekday}`;

    const isWeekend = weekday === "Sat" || weekday === "Sun";
    const minutesSinceMidnight = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30;
    const marketClose = 16 * 60;

    if (isWeekend || minutesSinceMidnight < marketOpen || minutesSinceMidnight >= marketClose) {
        return { timeOfDay: "market_closed", timeOfDayEt };
    }

    const minutesSinceOpen = minutesSinceMidnight - marketOpen;
    const minutesUntilClose = marketClose - minutesSinceMidnight;

    if (minutesSinceOpen <= 30) return { timeOfDay: "open", timeOfDayEt };
    if (minutesSinceOpen <= 90) return { timeOfDay: "early_session", timeOfDayEt };
    if (minutesUntilClose <= 30) return { timeOfDay: "close", timeOfDayEt };
    if (minutesUntilClose <= 90) return { timeOfDay: "late_session", timeOfDayEt };
    return { timeOfDay: "midday", timeOfDayEt };
}

export async function classifyMarketRegime(): Promise<{ marketRegime: MarketRegime; marketRegimeBasis: string }> {
    try {
        const provider = new AlpacaBarsProvider();
        const [spyBars, qqqBars] = await Promise.all([
            provider.getBars("SPY", "1Day", 5),
            provider.getBars("QQQ", "1Day", 5),
        ]);

        function realChangePercent(bars: Array<{ close: number }>): number | null {
            if (bars.length < 2) return null;
            const sorted = [...bars];
            const first = sorted[0].close;
            const last = sorted[sorted.length - 1].close;
            return first !== 0 ? ((last - first) / first) * 100 : null;
        }

        const spyChange = realChangePercent(spyBars);
        const qqqChange = realChangePercent(qqqBars);

        if (spyChange === null || qqqChange === null) {
            return { marketRegime: "neutral", marketRegimeBasis: "SPY/QQQ real price data unavailable -- defaulted to neutral, not a real regime call." };
        }

        const basis = `SPY ${spyChange >= 0 ? "+" : ""}${spyChange.toFixed(2)}%, QQQ ${qqqChange >= 0 ? "+" : ""}${qqqChange.toFixed(2)}% over the last 5 real trading days. Real, partial proxy only -- no VIX or breadth data available in this app.`;

        if (spyChange > 0.5 && qqqChange > 0.5) {
            return { marketRegime: "risk_on", marketRegimeBasis: basis };
        }
        if (spyChange < -0.5 && qqqChange < -0.5) {
            return { marketRegime: "risk_off", marketRegimeBasis: basis };
        }
        return { marketRegime: "neutral", marketRegimeBasis: basis };
    } catch {
        return { marketRegime: "neutral", marketRegimeBasis: "Real market regime data fetch failed -- defaulted to neutral, not a real regime call." };
    }
}

export async function classifyTickerEnvironment(ticker: string): Promise<TickerEnvironment | null> {
    const structure = await computePriceStructure(ticker);
    if (!structure) return null;

    let trendRegime: TrendRegime = "transitional";
    if (structure.structure === "range_bound") {
        trendRegime = "range_bound";
    } else if (structure.trend === "bullish" || structure.trend === "bearish") {
        trendRegime = "trending";
    }

    return {
        ticker,
        trendRegime,
        trend: structure.trend,
        structure: structure.structure,
    };
}

export async function getMarketEnvironment(): Promise<MarketEnvironment> {
    const [{ marketRegime, marketRegimeBasis }, { timeOfDay, timeOfDayEt }] = await Promise.all([
        classifyMarketRegime(),
        Promise.resolve(classifyTimeOfDay()),
    ]);

    return { marketRegime, marketRegimeBasis, timeOfDay, timeOfDayEt };
}
