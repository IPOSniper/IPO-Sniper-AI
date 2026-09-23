import { EvidencePackage } from "./package";

import { CompanyBuilder } from "./builders/company/CompanyBuilder";
import { FinancialBuilder } from "./builders/financialBuilder";
import { ManagementBuilder } from "./builders/managementBuilder";
import { IPOBuilder } from "./builders/ipoBuilder";
import { MarketBuilder } from "./builders/marketBuilder";
import { IndustryBuilder } from "./builders/industryBuilder";
import { NewsBuilder } from "./builders/newsBuilder";
import { SecBuilder } from "./builders/secBuilder";
import { QuoteBuilder } from "./builders/quoteBuilder";
import { FinancialStatementsBuilder } from "./builders/financialStatementsBuilder";
import { backfillFinancialFromStatements } from "./backfill/financialBackfill";
import { backfillLiquidity } from "./backfill/liquidityBackfill";
import { backfillGrowthGuidance } from "./backfill/growthBackfill";
import { backfillMarketVolatility } from "./backfill/marketBackfill";

export class EvidenceEngine {

  constructor(

    private readonly companyBuilder = new CompanyBuilder(),

    private readonly financialBuilder = new FinancialBuilder(),

    private readonly managementBuilder = new ManagementBuilder(),

    private readonly ipoBuilder = new IPOBuilder(),

    private readonly marketBuilder = new MarketBuilder(),

    private readonly industryBuilder = new IndustryBuilder(),

    private readonly newsBuilder = new NewsBuilder(),

    private readonly secBuilder = new SecBuilder(),

    private readonly quoteBuilder = new QuoteBuilder(),

    private readonly financialStatementsBuilder = new FinancialStatementsBuilder()

  ) {}

  async build(symbol: string): Promise<EvidencePackage> {

    const company = await this.companyBuilder.build(symbol);

    // management is intentionally NOT in this first parallel batch --
    // it needs sharesOutstanding from financialStatements (below) to
    // compute a real insiderOwnership, so it's built afterward,
    // sequentially, rather than in parallel with everything else.
    const [
      financialRaw,
      ipo,
      marketRaw,
      industry,
      news,
      sec,
      quote,
      financialStatements,
    ] = await Promise.all([
      this.financialBuilder.build(symbol),
      this.ipoBuilder.build(symbol),
      this.marketBuilder.build(),
      this.industryBuilder.build(),
      this.newsBuilder.build(company.name),
      this.secBuilder.build(symbol),
      this.quoteBuilder.build(symbol),
      this.financialStatementsBuilder.build(symbol),
    ]);

    const latestStatement = financialStatements.statements.value[financialStatements.statements.value.length - 1];
    const management = await this.managementBuilder.build(symbol, latestStatement?.sharesOutstanding);

    // Backfill chain: each step fills specific fields from data
    // that's either already fetched above (financialBackfill) or a
    // small additional real fetch (liquidity/growth/market), never
    // overwriting an already-verified value. Each is independent and
    // fails closed to a no-op, not a crash, if its provider/key
    // isn't available. Run the independent ones in parallel.
    const financialAfterStatements = backfillFinancialFromStatements(
      financialRaw,
      financialStatements,
      quote
    );

    const financialWithLiquidity = backfillLiquidity(financialAfterStatements, financialStatements);

    const [financial, market] = await Promise.all([
      backfillGrowthGuidance(financialWithLiquidity, symbol),
      backfillMarketVolatility(marketRaw, symbol),
    ]);

    return {

      company,

      financial,

      management,

      ipo,

      market,

      industry,

      news,

      sec,

      quote,

      financialStatements,

    };

  }

}