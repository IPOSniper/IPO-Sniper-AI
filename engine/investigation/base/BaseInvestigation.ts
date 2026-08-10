import { KnowledgeFact } from "../../knowledge/contracts/KnowledgeFact";
import { InvestigationFinding } from "../findings/InvestigationFinding";

export abstract class BaseInvestigation {

    abstract readonly id: string;

    abstract readonly hypothesis: string;

    abstract evaluate(
        facts: KnowledgeFact[]
    ): InvestigationFinding;

    protected findFact(
        facts: KnowledgeFact[],
        id: string
    ): KnowledgeFact | undefined {

        return facts.find(
            fact => fact.id === id
        );

    }

    protected hasFact(
        facts: KnowledgeFact[],
        id: string
    ): boolean {

        return this.findFact(
            facts,
            id
        ) !== undefined;

    }

}
