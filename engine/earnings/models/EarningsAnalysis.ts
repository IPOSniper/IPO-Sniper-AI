import { RevenueAnalysis } from "./RevenueAnalysis";
import { EPSAnalysis } from "./EPSAnalysis";

export interface EarningsAnalysis {

    revenue: RevenueAnalysis;

    eps: EPSAnalysis;

}
