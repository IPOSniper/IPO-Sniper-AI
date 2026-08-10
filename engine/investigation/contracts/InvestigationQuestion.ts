export interface InvestigationQuestion {

    id: string;

    analyst: string;

    category: string;

    question: string;

    description: string;

    requiredEvidence: string[];

    decisionRule: string;

    weight: number;

    required: boolean;

}
