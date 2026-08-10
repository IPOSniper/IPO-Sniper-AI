import { KnowledgeCategory } from "../models/KnowledgeCategory";

export interface KnowledgeFact {

    id: string;

    category: KnowledgeCategory;

    name: string;

    description: string;

    value: unknown;

    confidence: number;

    evidence: string[];

}
