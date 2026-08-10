export interface InvestigationFinding {

    hypothesisId: string;

    passed: boolean;

    score: number;

    confidence: number;

    summary: string;

    supportingFacts: string[];

    contradictingFacts: string[];

    assumptions: string[];

    risks: string[];

    monitoringItems: string[];

}
