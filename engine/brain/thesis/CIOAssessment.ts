import type { InvestmentThesis } from "./contracts/InvestmentThesis";
import type { MonitoringPlan } from "./MonitoringPlan";

export interface CIOAssessment {

    executiveSummary: string;

    thesis: InvestmentThesis;

    confidence: number;

    conviction: number;

    uncertainty: number;

    monitoring: MonitoringPlan;

}
