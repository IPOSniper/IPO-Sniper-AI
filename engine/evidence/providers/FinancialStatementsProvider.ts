import { FinancialStatement } from "../../types/FinancialStatement";

export interface FinancialStatementsProvider {

  getFinancialStatements(
    ticker: string
  ): Promise<FinancialStatement[]>;

}
