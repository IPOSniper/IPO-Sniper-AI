import { ChiefInvestmentOfficer } from "./ChiefInvestmentOfficer";
import type { Analyst } from "./contracts/Analyst";
import type { CommitteeReport } from "./contracts/CommitteeReport";

export class CommitteeEngine<TInput> {
  private readonly cio: ChiefInvestmentOfficer<TInput>;

  constructor(
    private readonly analysts: Analyst<TInput>[]
  ) {
    this.cio = new ChiefInvestmentOfficer(analysts);
  }

  async analyze(input: TInput): Promise<CommitteeReport> {
    return this.cio.analyze(input);
  }
}
