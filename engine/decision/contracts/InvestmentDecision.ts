import type { InvestmentThesis } from "../../brain/thesis/contracts/InvestmentThesis";
import type { Scenario } from "./Scenario";
import type { RiskAssessment } from "./RiskAssessment";

export interface InvestmentDecision {

    recommendation: string;

    conviction: number;

    confidence: number;

    thesis: InvestmentThesis;

    antiThesis: InvestmentThesis;

    bullCase: Scenario;

    baseCase: Scenario;

    bearCase: Scenario;

    risks: RiskAssessment[];

    monitoringItems: string[];

}
