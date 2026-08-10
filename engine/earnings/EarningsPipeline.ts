import { RevenueAnalyzer } from "./analyzers/RevenueAnalyzer";
import { EPSAnalyzer } from "./analyzers/EPSAnalyzer";
import { FinnhubEarningsProvider } from "./providers/FinnhubEarningsProvider";

export class EarningsPipeline {

    public readonly provider =
        new FinnhubEarningsProvider();

    public readonly revenueAnalyzer =
        new RevenueAnalyzer();

    public readonly epsAnalyzer =
        new EPSAnalyzer();

}
