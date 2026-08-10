import {
  generateCommitteeReport,
  InvestmentCommitteeReport,
} from "./";

export class CommitteeService {
  async evaluate(
    ticker: string
  ): Promise<InvestmentCommitteeReport> {
    return generateCommitteeReport(ticker);
  }
}

export const committeeService = new CommitteeService();
