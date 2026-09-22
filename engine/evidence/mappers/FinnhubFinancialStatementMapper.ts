import { FinancialStatement } from "../../types/FinancialStatement";



interface FinnhubStatementItem {
  concept: string;
  value: number;
}

interface FinnhubReport {
  bs?: FinnhubStatementItem[];
  ic?: FinnhubStatementItem[];
  cf?: FinnhubStatementItem[];
}

interface FinnhubFiling {
  year: number;
  report: FinnhubReport;
}

interface FinnhubFinancialResponse {
  data: FinnhubFiling[];
}
export class FinnhubFinancialStatementMapper {

  private getValue(
    statements: FinnhubStatementItem[],
    concept: string
  ): number {

    const item = statements.find(
      (x) => x.concept === concept
    );

    return item?.value ?? 0;

  }

  private getFirstValue(
    statements: FinnhubStatementItem[],
    concepts: string[]
  ): number {

    for (const concept of concepts) {

      const value = this.getValue(
        statements,
        concept
      );

      if (value !== 0) {
        return value;
      }

    }

    return 0;

  }

  /**
   * Total debt = long-term portion + current portion. Each portion tries the
   * common us-gaap tags in order and only falls through when the earlier tag
   * is absent, so filers that already mapped correctly keep the same
   * long-term figure. If only the all-in LongTermDebt tag exists (it already
   * includes the current portion), current maturities are not added twice.
   */
  private computeDebt(bs: FinnhubStatementItem[]): number {
    const longTerm = this.getFirstValue(bs, [
      "us-gaap_LongTermDebtNoncurrent",
      "us-gaap_LongTermDebtAndCapitalLeaseObligations",
      "us-gaap_LongTermNotesPayable",
      "us-gaap_SeniorLongTermNotes"
    ]);

    const shortBorrowings = this.getValue(bs, "us-gaap_ShortTermBorrowings");
    const current =
      this.getValue(bs, "us-gaap_DebtCurrent") ||
      shortBorrowings +
        this.getFirstValue(bs, [
          "us-gaap_LongTermDebtCurrent",
          "us-gaap_LongTermDebtAndCapitalLeaseObligationsCurrent"
        ]);

    if (longTerm !== 0) {
      return longTerm + current;
    }

    const allInLongTerm = this.getValue(bs, "us-gaap_LongTermDebt");
    if (allInLongTerm !== 0) {
      return allInLongTerm + shortBorrowings;
    }

    return current;
  }

  map(data: FinnhubFinancialResponse): FinancialStatement[] {

    return data.data.map((filing) => {

      const bs = filing.report.bs ?? [];
      const ic = filing.report.ic ?? [];
      const cf = filing.report.cf ?? [];

      const revenue = this.getFirstValue(
        ic,
        [
          "us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax",
            "us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax",
            "us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax",
          "us-gaap_SalesRevenueNet",
          "us-gaap_Revenues",
          "us-gaap_Revenue",
          "us-gaap_SalesRevenueServicesNet"
        ]
      );

      const costOfRevenue = this.getFirstValue(
        ic,
        [
          "us-gaap_CostOfGoodsAndServicesSold",
          "us-gaap_CostOfRevenue",
          "us-gaap_CostOfGoodsSold",
          "us-gaap_CostOfSales",
          "us-gaap_CostOfServices",
          "us-gaap_CostOfProductsSold"
        ]
      );

      const operatingCashFlow = this.getValue(
        cf,
        "us-gaap_NetCashProvidedByUsedInOperatingActivities"
      );

      const capex = this.getValue(
        cf,
        "us-gaap_PaymentsToAcquirePropertyPlantAndEquipment"
      );

      const grossProfit =
        this.getFirstValue(
          ic,
          [
            "us-gaap_GrossProfit"
          ]
        ) ||
        (revenue - costOfRevenue);

      return {

        revenue,

        grossProfit,

        operatingIncome:
          this.getValue(
            ic,
            "us-gaap_OperatingIncomeLoss"
          ),

        netIncome:
          this.getValue(
            ic,
            "us-gaap_NetIncomeLoss"
          ),

        freeCashFlow:
          operatingCashFlow - capex,

        totalAssets:
          this.getValue(
            bs,
            "us-gaap_Assets"
          ),

        totalLiabilities:
          this.getValue(
            bs,
            "us-gaap_Liabilities"
          ),

        shareholdersEquity:
          this.getValue(
            bs,
            "us-gaap_StockholdersEquity"
          ),

        cash:
          this.getValue(
            bs,
            "us-gaap_CashAndCashEquivalentsAtCarryingValue"
          ),

        debt: this.computeDebt(bs),

        sharesOutstanding: this.getFirstValue(ic, [
          "us-gaap_WeightedAverageNumberOfDilutedSharesOutstanding",
          "us-gaap_WeightedAverageNumberOfSharesOutstandingBasic",
          "us-gaap_WeightedAverageNumberOfShareOutstandingBasicAndDiluted"
        ]),

        fiscalYear:
          filing.year,

        currentAssets:
          this.getFirstValue(
            bs,
            ["us-gaap_AssetsCurrent"]
          ),

        currentLiabilities:
          this.getFirstValue(
            bs,
            ["us-gaap_LiabilitiesCurrent"]
          ),

        inventory:
          this.getFirstValue(
            bs,
            ["us-gaap_InventoryNet", "us-gaap_InventoryGross"]
          )

      } as FinancialStatement;

    });

  }

}
