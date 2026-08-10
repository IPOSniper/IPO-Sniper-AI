export type KnowledgeNodeType =
    | "Company"
    | "Metric"
    | "Finding"
    | "Claim"
    | "Hypothesis"
    | "Catalyst"
    | "Risk"
    | "Decision"
    | "Evidence";

export interface KnowledgeNode {

    id: string;

    type: KnowledgeNodeType;

    title: string;

    description?: string;

}
