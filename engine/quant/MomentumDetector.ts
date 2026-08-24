import { AlpacaBarsProvider, type PriceBar } from "@/engine/evidence/providers/AlpacaBarsProvider";

/**
 * Hedge Fund Layer 2, Momentum Radar v1 -- deliberately narrow scope:
 * RVOL + simple price change only. Real acceleration/range-expansion/
 * breakout detection are explicitly deferred to a future pass.
 *
 * Reuses the existing, already-proven AlpacaBarsProvider.getBars()
 * (already used by EnvironmentEngine.ts and PriceStructureEngine.ts)
 * -- no new market-data provider.
 *
 * RVOL baseline = average volume of the 20 trading days before the
 * most recent bar, excluding the most recent bar itself. If fewer
 * than 21 real bars are returned (e.g. a recent IPO), this honestly
 * reports INSUFFICIENT_DATA rather than compute a misleading ratio
 * off a shorter window.
 *
 * Stage classification is a simple, honest threshold on RVOL alone
 * for v1 -- not the fuller multi-signal classifier from the original
 * design. Momentum Radar does not trade and never will from this
 * module -- it only classifies. Any downstream action flows through
 * the existing OpportunityEngine -> Committee -> RiskEngine -> Quant
 * Control -> execution path.
 */

export type MomentumStage = "EARLY" | "DEVELOPING" | "CONFIRMED" | "FADING" | "INSUFFICIENT_DATA";

export interface MomentumObservation {
    ticker: string;
    rvol: number | null;
    priceChangePercent: number | null;
    stage: MomentumStage;
    currentVolume: number | null;
    averageVolume: number | null;
    latestClose: number | null;
    observedAt: string;
}

const RVOL_BASELINE_DAYS = 20;
const MIN_REQUIRED_BARS = RVOL_BASELINE_DAYS + 1;

function classifyStage(rvol: number): MomentumStage {
    if (rvol >= 4) return "CONFIRMED";
    if (rvol >= 2) return "DEVELOPING";
    if (rvol >= 1.3) return "EARLY";
    return "FADING";
}

export async function detectMomentum(ticker: string): Promise<MomentumObservation> {
    const observedAt = new Date().toISOString();
    const insufficientResult: MomentumObservation = {
        ticker, rvol: null, priceChangePercent: null, stage: "INSUFFICIENT_DATA",
        currentVolume: null, averageVolume: null, latestClose: null, observedAt,
    };

    try {
        const bars: PriceBar[] = await new AlpacaBarsProvider().getBars(ticker, "1Day", MIN_REQUIRED_BARS + 5);
        if (bars.length < MIN_REQUIRED_BARS) return insufficientResult;

        const latest = bars[bars.length - 1];
        const priorBars = bars.slice(-MIN_REQUIRED_BARS, -1);
        const previousClose = bars[bars.length - 2]?.close ?? null;

        const averageVolume = priorBars.reduce((sum, b) => sum + b.volume, 0) / priorBars.length;
        if (averageVolume <= 0) return insufficientResult;

        const rvol = latest.volume / averageVolume;
        const priceChangePercent = previousClose
            ? ((latest.close - previousClose) / previousClose) * 100
            : null;

        return {
            ticker,
            rvol,
            priceChangePercent,
            stage: classifyStage(rvol),
            currentVolume: latest.volume,
            averageVolume,
            latestClose: latest.close,
            observedAt,
        };
    } catch {
        return insufficientResult;
    }
}