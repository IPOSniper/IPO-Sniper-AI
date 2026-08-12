import { FinnhubFinancialStatementMapper } from "../mappers/FinnhubFinancialStatementMapper";
import { FinancialStatement } from "../../types/FinancialStatement";
import { FinancialStatementsProvider } from "./FinancialStatementsProvider";
import { fetchWithRetry } from "../../api/fetchWithRetry";

/**
 * Real Finnhub /stock/financials-reported client — actual SEC XBRL
 * filing data, mapped by FinnhubFinancialStatementMapper (multi-
 * concept fallback across the various XBRL tag names companies use
 * inconsistently). freq=annual requests yearly filings specifically,
 * not quarterly, to match "multi-year" framing in the UI.
 *
 * Cleaned up from its original form: stripped debug console.log/
 * console.dir calls that dumped full API responses and request URLs
 * (including the API key, in the URL) to server logs — fine for a
 * one-off manual test script, not for a real evidence builder that
 * runs on every research request.
 */
export class FinnhubFinancialStatementsProvider
  implements FinancialStatementsProvider {

  private readonly mapper =
    new FinnhubFinancialStatementMapper();

  async getFinancialStatements(
    ticker: string
  ): Promise<FinancialStatement[]> {

    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      throw new Error("FINNHUB_API_KEY is missing.");
    }

    const url =
      `https://finnhub.io/api/v1/stock/financials-reported?symbol=${ticker}&freq=annual&token=${apiKey}`;

    const response = await fetchWithRetry(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Finnhub financials-reported request failed: ${response.status}`);
    }

    const data = await response.json();

    const statements = this.mapper.map(data);

    // Ascending by fiscal year so charts don't need to re-sort.
    return statements.sort((a, b) => a.fiscalYear - b.fiscalYear);

  }

}
