export interface InvestigationFinding {

    questionId: string;

    answer: string;

    confidence: number;

    score: number;

    supportingEvidence: string[];

    contradictingEvidence: string[];

    assumptions: string[];

    recommendation: string;

}
