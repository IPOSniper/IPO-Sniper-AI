import { FinnhubQuoteProvider } from "@/engine/evidence/providers/FinnhubQuoteProvider";
import { FinnhubFinancialStatementsProvider } from "@/engine/evidence/providers/FinnhubFinancialStatementsProvider";
import { PeerMultiples } from "./ComparableCompaniesEngine";

export async function getMultiplesForTicker(ticker: string): Promise<PeerMultiples> {
    const quoteProvider = new FinnhubQuoteProvider();
    const statementsProvider = new FinnhubFinancialStatementsProvider();

    try {
        const [marketCap, quote, statements] = await Promise.all([
            quoteProvider.getMarketCap(ticker),
            quoteProvider.getQuote(ticker),
            statementsProvider.getFinancialStatements(ticker),
        ]);

        const latest = statements.length > 0 ? statements[statements.length - 1] : null;

        let peRatio: number | null = null;
        let evToRevenue: number | null = null;

        if (latest) {
            const enterpriseValue = marketCap + (latest.debt ?? 0) - (latest.cash ?? 0);

            if (latest.revenue && latest.revenue > 0) {
                evToRevenue = enterpriseValue / latest.revenue;
            }

            if (latest.sharesOutstanding && latest.sharesOutstanding > 0 && latest.netIncome) {
                const eps = latest.netIncome / latest.sharesOutstanding;
                if (eps > 0) {
                    peRatio = quote.price / eps;
                }
            }
        }

        return {
            ticker,
            peRatio,
            evToRevenue,
            evToEbitda: null,
        };
    } catch {
        return { ticker, peRatio: null, evToRevenue: null, evToEbitda: null };
    }
}
