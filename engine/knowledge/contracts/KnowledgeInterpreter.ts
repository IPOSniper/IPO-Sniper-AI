import type { EvidencePackage } from "../../evidence/package";
import type { KnowledgeFact } from "./KnowledgeFact";

export interface KnowledgeInterpreter {

    interpret(
        evidence: EvidencePackage
    ): KnowledgeFact;

}
