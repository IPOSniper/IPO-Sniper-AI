export interface EarningsEvent {
    company: string;

    fiscalQuarter: string;

    fiscalYear: number;

    reportDate: Date;

    estimatedEPS: number;

    actualEPS: number;

    estimatedRevenue: number;

    actualRevenue: number;

    // Real prior-period actuals, when available — null (not
    // silently backfilled with an estimate) when Finnhub doesn't
    // have a second row to compare against.
    previousEPS: number | null;

    previousRevenue: number | null;
}
