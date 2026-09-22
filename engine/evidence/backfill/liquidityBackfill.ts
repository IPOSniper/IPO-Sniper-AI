import type { FinancialEvidence } from "../package";
import type { FinancialStatementsEvidence } from "../package";

/**
 * Fills currentRatio/quickRatio from real, already-fetched financial
 * statement data (SEC XBRL tags via Finnhub's financials-reported,
 * the same source as the rest of the statements pipeline) instead of
 * a separate FMP call. Confirmed live: Finnhub's response includes
 * us-gaap_AssetsCurrent / us-gaap_LiabilitiesCurrent / us-gaap_InventoryNet
 * as standard reported tags (verified against a real AAPL response --
 * these are common, well-reported line items). This removes the FMP
 * paid-tier dependency the original version required (FMP gates
 * balance-sheet-statement behind their $19/mo Starter plan; this
 * data was already sitting unused in data you already fetch for
 * free). FMPBalanceSheetProvider.ts is left in place, unused, in
 * case a future need for FMP-specific fields arises.
 */
export function backfillLiquidity(
    financial: FinancialEvidence,
    financialStatements: FinancialStatementsEvidence
): FinancialEvidence {

    if (financial.currentRatio.verified) {
        return financial; // already real, don't overwrite
    }

    if (!financialStatements.statements.verified || financialStatements.statements.value.length === 0) {
        return financial;
    }

    const statements = financialStatements.statements.value; // ascending by fiscalYear
    const latest = statements[statements.length - 1];

    if (!latest.currentLiabilities || latest.currentLiabilities === 0) {
        return financial;
    }

    const now = new Date();
    const source = "SEC" as const;

    const currentRatio = latest.currentAssets / latest.currentLiabilities;
    const quickRatio = (latest.currentAssets - latest.inventory) / latest.currentLiabilities;

    return {
        ...financial,
        currentRatio: { value: currentRatio, source, confidence: 75, verified: true, collectedAt: now },
        quickRatio: { value: quickRatio, source, confidence: 70, verified: true, collectedAt: now },
    };
}