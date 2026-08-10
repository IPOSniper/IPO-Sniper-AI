
import { CausalAnalysis } from "./CausalAnalysis";
import { CapitalAllocationAssessment } from "./CapitalAllocationAssessment";
import { DecisionConfidence } from "./DecisionConfidence";
import { PortfolioImpact } from "./PortfolioImpact";
import { ReasoningStep } from "./ReasoningStep";
import { ScenarioEvaluation } from "./ScenarioEvaluation";

export interface ReasoningResult {

    overallConclusion: string;

    confidence: number;

    thesisImpact: "Increase" | "Decrease" | "Neutral";

    risks: string[];

    opportunities: string[];

    reasoning: ReasoningStep[];

    causalAnalysis: CausalAnalysis;

    capitalAllocation: CapitalAllocationAssessment;

    scenarios: ScenarioEvaluation;

    decisionConfidence: DecisionConfidence;

    portfolioImpact: PortfolioImpact;

}

