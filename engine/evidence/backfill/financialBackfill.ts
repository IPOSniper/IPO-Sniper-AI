import type { FinancialEvidence, FinancialStatementsEvidence, QuoteEvidence } from "../package";

/**
 * Fills specific FinancialEvidence fields from data that's already
 * real and already fetched (SEC-derived financial statements, live
 * quote) — NOT a new provider integration, a reuse of what's already
 * wired in. Directly closes several "No verified data" analysts:
 * Balance Sheet, Cash Flow, Growth, and (via revenueHistory) the
 * Financial Analyst investigation pathway, plus partially unblocks
 * Risk Analyst (which depends on debtToEquity).
 *
 * Deliberately does NOT touch fields it has no real basis for:
 * operatingCashFlow specifically (FinancialStatement only has
 * freeCashFlow, which is a different, related-but-distinct metric —
 * OCF minus CapEx — not fabricated here), currentRatio/quickRatio
 * (need current-portion balance sheet detail this data doesn't
 * have), or anything already verified from a direct provider (never
 * overwrites a real value with a lower-confidence derived one).
 *
 * Confidence levels here are deliberately below the 90-100 range
 * used for direct real-time provider metrics: this is real SEC data,
 * but annual (not TTM/quarterly), and psRatio/evToRevenue mix a
 * live quote against a possibly-stale filed statement.
 */
export function backfillFinancialFromStatements(
    financial: FinancialEvidence,
    financialStatements: FinancialStatementsEvidence,
    quote: QuoteEvidence
): FinancialEvidence {

    if (!financialStatements.statements.verified || financialStatements.statements.value.length === 0) {
        return financial;
    }

    const now = new Date();
    const secSource = "SEC" as const;
    const derivedSource = "INTERNAL" as const;

    const statements = financialStatements.statements.value; // ascending by fiscalYear
    const latest = statements[statements.length - 1];

    const backfilled: FinancialEvidence = { ...financial };

    if (!financial.cashAndEquivalents.verified) {
        backfilled.cashAndEquivalents = {
            value: latest.cash, source: secSource, confidence: 70, verified: true, collectedAt: now,
        };
    }

    if (!financial.totalDebt.verified) {
        backfilled.totalDebt = {
            value: latest.debt, source: secSource, confidence: 70, verified: true, collectedAt: now,
        };
    }

    if (!financial.debtToEquity.verified && latest.shareholdersEquity !== 0) {
        backfilled.debtToEquity = {
            value: latest.debt / latest.shareholdersEquity,
            source: secSource, confidence: 65, verified: true, collectedAt: now,
        };
    }

    if (!financial.freeCashFlow.verified) {
        backfilled.freeCashFlow = {
            value: latest.freeCashFlow, source: secSource, confidence: 70, verified: true, collectedAt: now,
        };
    }

    if (!financial.revenueHistory.verified && statements.length >= 2) {
        backfilled.revenueHistory = {
            value: statements.map(s => s.revenue),
            source: secSource, confidence: 75, verified: true, collectedAt: now,
        };
    }

    if (quote.marketCap.verified && latest.revenue > 0) {

        if (!financial.psRatio.verified) {
            backfilled.psRatio = {
                value: quote.marketCap.value / latest.revenue,
                source: derivedSource, confidence: 55, verified: true, collectedAt: now,
            };
        }

        if (!financial.evToRevenue.verified) {
            const enterpriseValue = quote.marketCap.value + latest.debt - latest.cash;
            backfilled.evToRevenue = {
                value: enterpriseValue / latest.revenue,
                source: derivedSource, confidence: 55, verified: true, collectedAt: now,
            };
        }
    }

    return backfilled;
}
