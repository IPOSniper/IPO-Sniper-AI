import { Company } from "./Company";

export interface InvestmentDecisionReport {
    company: Company;
    executiveDecision: ExecutiveDecision;
    wallStreet: ExpectationSummary;
    ipoSniper: ExpectationSummary;
    keyMetrics: KeyMetric[];
    scenarios: ScenarioAnalysis;
    capitalRotation: CapitalRotation;
    portfolioImpact: PortfolioImpact;
    riskRadar: RiskRadar;
    evidence: EvidenceSummary;
}

export interface ExecutiveDecision {
    recommendation: "Strong Buy" | "Buy" | "Hold" | "Reduce" | "Sell";
    capitalAllocationScore: number;
    confidence: number;
    summary: string;
}

export interface ExpectationSummary {
    metrics: MetricExpectation[];
}

export interface MetricExpectation {
    name: string;
    expected: string;
    confidence: number;
}

export interface KeyMetric {
    name: string;
    importance: number;
    reason: string;
}

export interface ScenarioAnalysis {
    bull: Scenario;
    base: Scenario;
    bear: Scenario;
}

export interface Scenario {
    probability: number;
    summary: string;
    catalysts: string[];
}

export interface CapitalRotation {
    winners: string[];
    losers: string[];
}

export interface PortfolioImpact {
    increaseExposure: string[];
    reduceExposure: string[];
    cashTarget: number;
}

export interface RiskRadar {
    risks: Risk[];
}

export interface Risk {
    title: string;
    severity: number;
}

export interface EvidenceSummary {
    strengths: string[];
    concerns: string[];
}