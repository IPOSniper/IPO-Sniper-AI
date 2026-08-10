import { EvidenceBuilder } from "../types";
import { FinancialStatementsEvidence } from "../package";
import { FinnhubFinancialStatementsProvider } from "../providers/FinnhubFinancialStatementsProvider";

export class FinancialStatementsBuilder
    implements EvidenceBuilder<FinancialStatementsEvidence> {

    private readonly provider = new FinnhubFinancialStatementsProvider();

    async build(ticker: string): Promise<FinancialStatementsEvidence> {
        const now = new Date();
        const source = "FINNHUB" as const;

        try {
            const statements = await this.provider.getFinancialStatements(ticker);

            if (statements.length === 0) {
                throw new Error(`No financial statements returned for ${ticker}.`);
            }

            return {
                statements: {
                    value: statements,
                    source,
                    // Real SEC filing data, but the XBRL-tag fallback
                    // mapping can miss unconventional filers — see
                    // FinnhubFinancialStatementMapper.ts. Not 100
                    // since a handful of tags per statement could
                    // legitimately map to 0 rather than a real value.
                    confidence: 80,
                    verified: true,
                    collectedAt: now,
                },
            };

        } catch {
            return {
                statements: { value: [], source, confidence: 0, verified: false, collectedAt: now },
            };
        }
    }

}
