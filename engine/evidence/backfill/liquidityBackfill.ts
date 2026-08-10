import type { FinancialEvidence } from "../package";
import { FMPBalanceSheetProvider } from "../providers/FMPBalanceSheetProvider";

/**
 * Fills currentRatio/quickRatio from real FMP balance sheet data —
 * the one field pair the SEC-statements backfill couldn't reach
 * (Finnhub's financials-reported doesn't break out current-portion
 * assets/liabilities). This is what actually unblocks Liquidity
 * Analyst.
 */
export async function backfillLiquidity(
    financial: FinancialEvidence,
    ticker: string
): Promise<FinancialEvidence> {

    if (financial.currentRatio.verified) {
        return financial; // already real, don't overwrite
    }

    try {
        const provider = new FMPBalanceSheetProvider();
        const sheet = await provider.getLatestBalanceSheet(ticker);

        if (!sheet || sheet.totalCurrentLiabilities === 0) {
            return financial;
        }

        const now = new Date();
        const source = "FMP" as const;

        const currentRatio = sheet.totalCurrentAssets / sheet.totalCurrentLiabilities;
        const quickRatio = (sheet.totalCurrentAssets - sheet.inventory) / sheet.totalCurrentLiabilities;

        return {
            ...financial,
            currentRatio: { value: currentRatio, source, confidence: 75, verified: true, collectedAt: now },
            quickRatio: { value: quickRatio, source, confidence: 70, verified: true, collectedAt: now },
        };

    } catch {
        return financial; // honest no-op on failure, not a crash
    }
}
