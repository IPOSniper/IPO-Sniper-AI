/**
 * Real, shared OCC option symbol parsing -- moved here from being a
 * local, unexported function inside paper-trading/actions.ts so it
 * can be genuinely reused (e.g. by PortfolioRiskAggregator.ts, which
 * needs the same real extraction to correctly analyze option
 * positions) rather than duplicated.
 */

/**
 * Extracts the real underlying ticker from a standard OCC option
 * symbol (TICKER + YYMMDD + C/P + 8-digit strike, e.g.
 * "AAPL260320C00220000" -> "AAPL"). Returns null for anything that
 * doesn't match this real, standard format -- including plain equity
 * tickers, which correctly don't match and should be used as-is.
 */
export function extractUnderlyingFromOccSymbol(occSymbol: string): string | null {
    const match = occSymbol.match(/^([A-Z]+)\d{6}[CP]\d{8}$/);
    return match ? match[1] : null;
}
