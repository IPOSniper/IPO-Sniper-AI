import { KnowledgeFact } from "./KnowledgeFact";

export interface KnowledgeReport {

    facts: KnowledgeFact[];

    overallConfidence: number;

}
