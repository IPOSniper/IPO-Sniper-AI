import { KnowledgeFact } from "../../knowledge/contracts/KnowledgeFact";
import { InvestigationFinding } from "../findings/InvestigationFinding";
import { InvestigationPlan } from "../plans/InvestigationPlan";
import { InvestigationRegistry } from "../registry/InvestigationRegistry";

export class InvestigationExecutor {

    constructor(
        private readonly registry: InvestigationRegistry
    ) {}

    public execute(
        plan: InvestigationPlan,
        facts: KnowledgeFact[]
    ): InvestigationFinding[] {

        return plan.investigationIds.map(id =>
            this.registry.get(id).evaluate(facts)
        );

    }

}
