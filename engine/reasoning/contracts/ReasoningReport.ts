import { ReasoningSection } from "./ReasoningSection";

export interface ReasoningReport {

    overallScore: number;

    confidence: number;

    summary: string;

    sections: ReasoningSection[];

}
