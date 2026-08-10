
export interface ReasoningStep {

    title: string;

    question: string;

    answer: string;

    evidence: string[];

    confidence: number;

    assumptions: string[];

    conclusion: string;

}

