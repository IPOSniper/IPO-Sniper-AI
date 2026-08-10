import { KnowledgeFact } from "../knowledge/contracts/KnowledgeFact";
import { InvestigationFinding } from "./findings/InvestigationFinding";
import { InvestigationRegistry } from "./registry/InvestigationRegistry";

export class InvestigationEngine {

    private readonly registry = new InvestigationRegistry();

    async investigate(
        facts: KnowledgeFact[]
    ): Promise<InvestigationFinding[]> {

        const findings: InvestigationFinding[] = [];

        for (const investigation of this.registry.getAll()) {

            findings.push(
                investigation.evaluate(facts)
            );

        }

        return findings;

    }

}